import { onSocketEvent, type DeliveryStatus } from '../socket'
import { createMessageElement } from '../utils'

const chat = document.querySelector('#chat')!

// Mensagens enviadas ainda sem confirmação do servidor (id -> elemento)
const pendingElements = new Map<string, HTMLElement>()

function appendMessage(element: HTMLElement) {
	chat.appendChild(element)
	chat.scrollTop = chat.scrollHeight
}

function addNotice(text: string) {
	const element = document.createElement('p')
	element.className = 'notice'
	element.textContent = text
	appendMessage(element)
}

function addOutgoingMessage(id: string, text: string) {
	const element = createMessageElement('Você', text, 'out')
	element.classList.add('is-pending')

	pendingElements.set(id, element)
	appendMessage(element)
}

function setDeliveryStatus(id: string, status: DeliveryStatus) {
	const element = pendingElements.get(id)
	if (!element) return

	pendingElements.delete(id)
	element.classList.remove('is-pending')
	element.classList.toggle('is-failed', status === 'failed')
}

export function initMessages() {
	onSocketEvent('messageQueued', ({ id, text }) => addOutgoingMessage(id, text))
	onSocketEvent('messageStatus', ({ id, status }) => setDeliveryStatus(id, status))
	onSocketEvent('messageReceived', ({ author, text }) => appendMessage(createMessageElement(author, text, 'in')))
	onSocketEvent('usernameChanged', ({ oldUsername, newUsername }) => addNotice(`${oldUsername} agora é ${newUsername}`))
	onSocketEvent('userJoined', ({ username }) => addNotice(`${username} entrou no chat`))
	onSocketEvent('userLeft', ({ username }) => addNotice(`${username} saiu do chat`))
	onSocketEvent('usernameStatus', ({ username, status, previousUsername }) => {
		if (status !== 'accepted') return

		if (previousUsername === null) addNotice(`Você entrou no chat como ${username}`)
		else if (previousUsername !== username) addNotice(`Você agora é ${username}`)
	})
}
