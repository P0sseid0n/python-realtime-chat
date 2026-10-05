import { createClientMessage, getParsedServerMessage } from './utils'
import type { StatusLabels } from './constants'
import type { ServerAck } from './types'

export type ConnectionStatus = keyof typeof StatusLabels

type SocketEventMap = {
	statusChange: ConnectionStatus
	sendingChange: boolean
	messageSent: string
	messageReceived: { author: string; text: string }
}

const socketEvents = new EventTarget()

let socket: WebSocket | null = null

// Mensagens enviadas aguardando ACK do servidor (id -> texto)
let pendingMessages: Record<string, string> = {}

function emit<K extends keyof SocketEventMap>(type: K, detail: SocketEventMap[K]) {
	socketEvents.dispatchEvent(new CustomEvent(type, { detail }))
}

export function onSocketEvent<K extends keyof SocketEventMap>(type: K, listener: (detail: SocketEventMap[K]) => void) {
	socketEvents.addEventListener(type, event => listener((event as CustomEvent<SocketEventMap[K]>).detail))
}

function isSending() {
	return Object.keys(pendingMessages).length > 0
}

function handleAck(ack: ServerAck) {
	const text = pendingMessages[ack.message_id]
	if (text === undefined) return

	delete pendingMessages[ack.message_id]
	emit('sendingChange', isSending())

	if (ack.status === 'success') {
		emit('messageSent', text)
	} else {
		console.warn('Servidor rejeitou a mensagem:', ack.message_id)
	}
}

function handleDisconnect() {
	pendingMessages = {}
	emit('sendingChange', false)
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
		}
	}

	socket.onclose = handleDisconnect
	socket.onerror = handleDisconnect
}

/** Retorna true se a mensagem foi enviada ao servidor. */
export function sendChatMessage(text: string): boolean {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		emit('statusChange', 'connecting')
		return false
	}

	const clientMessage = createClientMessage('SEND_TEXT', { text })
	pendingMessages[clientMessage.id] = text
	socket.send(JSON.stringify(clientMessage))
	emit('sendingChange', true)

	return true
}
