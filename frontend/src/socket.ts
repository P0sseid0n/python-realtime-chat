import { createClientMessage, getParsedServerMessage } from './utils'
import type { StatusLabels } from './constants'
import type { ServerAck } from './types'

export type ConnectionStatus = keyof typeof StatusLabels

export type DeliveryStatus = 'sent' | 'failed'

type SocketEventMap = {
	statusChange: ConnectionStatus
	messageQueued: { id: string; text: string }
	messageStatus: { id: string; status: DeliveryStatus }
	messageReceived: { author: string; text: string }
}

const socketEvents = new EventTarget()

let socket: WebSocket | null = null

// IDs das mensagens enviadas aguardando ACK do servidor
const pendingMessages = new Set<string>()

function emit<K extends keyof SocketEventMap>(type: K, detail: SocketEventMap[K]) {
	socketEvents.dispatchEvent(new CustomEvent(type, { detail }))
}

export function onSocketEvent<K extends keyof SocketEventMap>(type: K, listener: (detail: SocketEventMap[K]) => void) {
	socketEvents.addEventListener(type, event => listener((event as CustomEvent<SocketEventMap[K]>).detail))
}

function handleAck(ack: ServerAck) {
	if (!pendingMessages.delete(ack.message_id)) return

	if (ack.status === 'error') console.warn('Servidor rejeitou a mensagem:', ack.message_id)
	emit('messageStatus', { id: ack.message_id, status: ack.status === 'success' ? 'sent' : 'failed' })
}

function handleDisconnect() {
	// Sem conexão, nenhum ACK pendente vai chegar
	for (const id of pendingMessages) emit('messageStatus', { id, status: 'failed' })
	pendingMessages.clear()

	emit('statusChange', 'offline')
}

export function connect(url: string, username: string) {
	emit('statusChange', 'connecting')
	socket = new WebSocket(url)

	socket.onopen = () => {
		console.log('Conectado ao servidor WebSocket')
		emit('statusChange', 'online')

		socket?.send(JSON.stringify(createClientMessage('SET_USERNAME', { username })))
	}

	socket.onmessage = event => {
		console.log('Mensagem bruta recebida do servidor:', event.data)
		const message = getParsedServerMessage(event.data)
		console.log('Mensagem recebida do servidor:', message)

		if (!message) {
			console.warn('Mensagem do servidor ignorada por formato inválido')
			return
		}

		if (message.event === 'BROADCAST_TEXT') {
			emit('messageReceived', { author: message.author, text: message.text })
		} else if (message.event === 'ACK') {
			handleAck(message)
		} else if (message.event === 'ERROR') {
			console.warn('Erro do servidor:', message.message, message.detail ?? '')
		}
	}

	socket.onclose = handleDisconnect
	socket.onerror = handleDisconnect
}

/** Retorna true se a mensagem foi enviada ao servidor. */
export function sendChatMessage(text: string): boolean {
	if (!socket || socket.readyState !== WebSocket.OPEN) return false

	const clientMessage = createClientMessage('SEND_TEXT', { text })
	pendingMessages.add(clientMessage.id)
	socket.send(JSON.stringify(clientMessage))
	emit('messageQueued', { id: clientMessage.id, text })

	return true
}
