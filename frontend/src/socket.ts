import { createClientMessage, getParsedServerMessage } from './utils'
import type { StatusLabels } from './constants'
import type { ServerAck } from './types'

export type ConnectionStatus = keyof typeof StatusLabels

export type DeliveryStatus = 'sent' | 'failed'
export type UsernameStatus = 'accepted' | 'rejected'

type SocketEventMap = {
	statusChange: ConnectionStatus
	messageQueued: { id: string; text: string }
	messageStatus: { id: string; status: DeliveryStatus }
	messageReceived: { author: string; text: string }
	usernameStatus: { username: string; status: UsernameStatus; previousUsername: string | null }
	usernameChanged: { oldUsername: string; newUsername: string }
	userJoined: { username: string }
	userLeft: { username: string }
	userList: { usernames: string[] }
	userTyping: { username: string }
}

// Espera antes de cada tentativa de reconexão: 1s, 2s, 4s... até 30s
const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30_000

const socketEvents = new EventTarget()

let socket: WebSocket | null = null
let serverUrl: string | null = null
let reconnectAttempts = 0
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

// IDs das mensagens enviadas aguardando ACK do servidor
const pendingMessages = new Set<string>()

// Pedido de SET_USERNAME aguardando ACK do servidor
let pendingUsername: { id: string; username: string } | null = null

// Nome aceito pelo servidor na conexão atual
let currentUsername: string | null = null

// Último nome aceito, usado para entrar de novo automaticamente após uma reconexão
let lastAcceptedUsername: string | null = null

function emit<K extends keyof SocketEventMap>(type: K, detail: SocketEventMap[K]) {
	socketEvents.dispatchEvent(new CustomEvent(type, { detail }))
}

export function onSocketEvent<K extends keyof SocketEventMap>(type: K, listener: (detail: SocketEventMap[K]) => void) {
	socketEvents.addEventListener(type, event => listener((event as CustomEvent<SocketEventMap[K]>).detail))
}

function isOpen(ws: WebSocket | null): ws is WebSocket {
	return ws !== null && ws.readyState === WebSocket.OPEN
}

function handleAck(ack: ServerAck) {
	if (pendingUsername?.id === ack.message_id) {
		const { username } = pendingUsername
		const previousUsername = currentUsername
		pendingUsername = null

		if (ack.status === 'success') {
			currentUsername = username
			lastAcceptedUsername = username
		}
		emit('usernameStatus', { username, status: ack.status === 'success' ? 'accepted' : 'rejected', previousUsername })
		return
	}

	if (!pendingMessages.delete(ack.message_id)) return

	if (ack.status === 'error') console.warn('Servidor rejeitou a mensagem:', ack.message_id)
	emit('messageStatus', { id: ack.message_id, status: ack.status === 'success' ? 'sent' : 'failed' })
}

function handleDisconnect() {
	socket = null

	// Sem conexão, nenhum ACK pendente vai chegar
	for (const id of pendingMessages) emit('messageStatus', { id, status: 'failed' })
	pendingMessages.clear()
	pendingUsername = null
	currentUsername = null

	emit('statusChange', 'offline')
	scheduleReconnect()
}

function scheduleReconnect() {
	if (reconnectTimer !== null) return

	const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttempts, RECONNECT_MAX_DELAY)
	reconnectAttempts++
	console.log(`Tentando reconectar em ${delay / 1000}s`)

	reconnectTimer = setTimeout(() => {
		reconnectTimer = null
		openSocket()
	}, delay)
}

function openSocket() {
	if (serverUrl === null) return

	emit('statusChange', 'connecting')
	const ws = new WebSocket(serverUrl)
	socket = ws

	ws.onopen = () => {
		console.log('Conectado ao servidor WebSocket')
		reconnectAttempts = 0
		emit('statusChange', 'online')

		// Depois de uma queda, volta com o mesmo nome sem perguntar de novo
		if (lastAcceptedUsername !== null) setUsername(lastAcceptedUsername)
	}

	ws.onmessage = event => {
		console.log('Mensagem bruta recebida do servidor:', event.data)
		const message = getParsedServerMessage(event.data)
		console.log('Mensagem recebida do servidor:', message)

		if (!message) {
			console.warn('Mensagem do servidor ignorada por formato inválido')
			return
		}

		switch (message.event) {
			case 'ACK':
				handleAck(message)
				break
			case 'BROADCAST_TEXT':
				emit('messageReceived', { author: message.author, text: message.text })
				break
			case 'BROADCAST_TYPING':
				emit('userTyping', { username: message.username })
				break
			case 'BROADCAST_USERNAME_CHANGE':
				emit('usernameChanged', { oldUsername: message.old_username, newUsername: message.new_username })
				break
			case 'BROADCAST_USER_JOINED':
				emit('userJoined', { username: message.username })
				break
			case 'BROADCAST_USER_LEFT':
				emit('userLeft', { username: message.username })
				break
			case 'USER_LIST':
				emit('userList', { usernames: message.usernames })
				break
			case 'ERROR':
				console.warn('Erro do servidor:', message.message, message.detail ?? '')
				break
		}
	}

	// `error` sempre vem seguido de `close`, então a queda é tratada só no `close`
	ws.onerror = () => console.warn('Erro na conexão WebSocket')
	ws.onclose = () => {
		if (socket === ws) handleDisconnect()
	}
}

export function connect(url: string) {
	serverUrl = url
	openSocket()
}

/** Retorna true se a mensagem foi enviada ao servidor. */
export function sendChatMessage(text: string): boolean {
	if (!isOpen(socket)) return false

	const clientMessage = createClientMessage('SEND_TEXT', { text })
	pendingMessages.add(clientMessage.id)
	socket.send(JSON.stringify(clientMessage))
	emit('messageQueued', { id: clientMessage.id, text })

	return true
}

/** Avisa os outros usuários que você está digitando. */
export function sendTyping() {
	if (!isOpen(socket) || currentUsername === null) return

	socket.send(JSON.stringify(createClientMessage('TYPING', {})))
}

/** Pede ao servidor para usar esse nome. O resultado chega pelo evento `usernameStatus`. */
export function setUsername(username: string): boolean {
	if (!isOpen(socket)) return false

	const clientMessage = createClientMessage('SET_USERNAME', { username })
	pendingUsername = { id: clientMessage.id, username }
	socket.send(JSON.stringify(clientMessage))

	return true
}
