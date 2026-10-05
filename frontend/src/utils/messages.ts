import type { ClientEventMap, ServerEventMap, ServerMessage } from '../types'

export function createClientMessage<T extends keyof ClientEventMap>(
	event: T,
	payload: Omit<ClientEventMap[T], 'id' | 'event'>,
): ClientEventMap[T] {
	const message = {
		...payload,
		event,
	} as ClientEventMap[T]

	if (message.event !== 'TYPING') message.id = crypto.randomUUID()

	return message
}

export function getParsedServerMessage(data: string) {
	try {
		const parsed = JSON.parse(data)

		if (typeof parsed === 'object' && parsed !== null && 'event' in parsed) {
			return parsed as ServerEventMap[ServerMessage['event']]
		}
	} catch (e) {
		console.error('Failed to parse server message:', e)
	}

	return null
}
