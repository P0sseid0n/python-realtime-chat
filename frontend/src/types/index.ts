interface BaseCommand {
	id: string
}

export interface ClientSetUsername extends BaseCommand {
	event: 'SET_USERNAME'
	username: string
}

export interface ClientSendText extends BaseCommand {
	event: 'SEND_TEXT'
	text: string
}

export interface ClientTyping extends BaseCommand {
	event: 'TYPING'
}

export type ClientMessage = ClientSetUsername | ClientSendText | ClientTyping

export type ClientEventMap = {
	[K in ClientMessage['event']]: Extract<ClientMessage, { event: K }>
}

export interface ServerAck {
	event: 'ACK'
	status: 'success' | 'error'
	message_id: string
}

export interface ServerError {
	event: 'ERROR'
	message: string
	detail: string | null
}

export interface ServerBroadcastMessage {
	event: 'BROADCAST_TEXT'
	author: string
	text: string
}

export interface ServerBroadcastTyping {
	event: 'BROADCAST_TYPING'
	username: string
}

export type ServerMessage = ServerAck | ServerError | ServerBroadcastMessage | ServerBroadcastTyping

export type ServerEventMap = {
	[K in ServerMessage['event']]: Extract<ServerMessage, { event: K }>
}
