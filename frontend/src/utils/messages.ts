import { generateRandomMessageId } from '.'
import type { ClientEventMap, ClientMessage, ServerEventMap, ServerMessage } from '../types'

export function createJSONClientMessage<T extends ClientMessage['event'], K extends ClientEventMap[T]>(
	event: T,
	data: Omit<K, 'event' | 'id'>,
) {
	const message = {
		event,
		id: generateRandomMessageId(),
		...data,
	} as K

	return JSON.stringify(message)
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
