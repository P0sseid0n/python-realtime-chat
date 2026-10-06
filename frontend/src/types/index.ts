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

export interface ClientTyping {
	event: 'TYPING'
}

export type ClientEventMap = {
	SET_USERNAME: ClientSetUsername
	SEND_TEXT: ClientSendText
	TYPING: ClientTyping
}

export type ClientMessage = ClientEventMap[keyof ClientEventMap]

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

export interface ServerBroadcastUsernameChange {
	event: 'BROADCAST_USERNAME_CHANGE'
	old_username: string
	new_username: string
}

export interface ServerBroadcastUserJoined {
	event: 'BROADCAST_USER_JOINED'
	username: string
}

export interface ServerBroadcastUserLeft {
	event: 'BROADCAST_USER_LEFT'
	username: string
}

export type ServerMessage =
	| ServerAck
	| ServerError
	| ServerBroadcastMessage
	| ServerBroadcastTyping
	| ServerBroadcastUsernameChange
	| ServerBroadcastUserJoined
	| ServerBroadcastUserLeft

export type ServerEventMap = {
	[K in ServerMessage['event']]: Extract<ServerMessage, { event: K }>
}
