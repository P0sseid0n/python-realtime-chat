export * from './messages'

export function generateRandomUsername() {
	return 'user_' + Math.random().toString(36).substring(2, 9)
}

export function generateRandomMessageId() {
	return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function getFormattedTime(date: Date = new Date()): string {
	return new Intl.DateTimeFormat('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
	}).format(date)
}

export function createMessageElement(author: string, text: string, variant: 'in' | 'out'): HTMLDivElement {
	const msgContainer = document.createElement('div')
	msgContainer.className = `msg ${variant}`

	const authorElem = document.createElement('p')
	authorElem.className = 'author'
	authorElem.textContent = author
	msgContainer.appendChild(authorElem)

	const balloon = document.createElement('div')
	balloon.className = 'balloon'

	const textElem = document.createElement('p')
	textElem.className = 'content'
	textElem.textContent = text
	balloon.appendChild(textElem)

	const meta = document.createElement('span')
	meta.className = 'meta'
	meta.textContent = getFormattedTime()
	balloon.appendChild(meta)

	msgContainer.appendChild(balloon)

	return msgContainer
}
