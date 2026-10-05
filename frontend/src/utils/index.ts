export * from './messages'
export * from './dom'

export function generateRandomUsername() {
	return 'user_' + Math.random().toString(36).substring(2, 9)
}

export function getFormattedTime(date: Date = new Date()): string {
	return new Intl.DateTimeFormat('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}
