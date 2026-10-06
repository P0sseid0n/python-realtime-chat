import { onSocketEvent, sendChatMessage, type DeliveryStatus } from '../socket'
import { createMessageElement } from '../utils'

const chat = document.querySelector('#chat')!

// Mensagens enviadas ainda sem confirmação do servidor (id -> elemento e texto)
const pendingElements = new Map<string, { element: HTMLElement; text: string }>()

// Se já entrou no chat alguma vez, a próxima entrada é uma reconexão
let hasJoinedBefore = false

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

	pendingElements.set(id, { element, text })
	appendMessage(element)
}

function addRetryButton(element: HTMLElement, text: string) {
	const button = document.createElement('button')
	button.type = 'button'
	button.className = 'retry-button'
	button.textContent = 'Tentar de novo'

	// O reenvio cria um novo balão no fim do chat, então o que falhou é removido
	button.addEventListener('click', () => {
		if (sendChatMessage(text)) element.remove()
	})

	element.appendChild(button)
}

function setDeliveryStatus(id: string, status: DeliveryStatus) {
	const pending = pendingElements.get(id)
	if (!pending) return

	const { element, text } = pending
	pendingElements.delete(id)
	element.classList.remove('is-pending')

	if (status === 'failed') {
		element.classList.add('is-failed')
		addRetryButton(element, text)
	}
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

		if (previousUsername === null) {
			addNotice(hasJoinedBefore ? `Reconectado como ${username}` : `Você entrou no chat como ${username}`)
			hasJoinedBefore = true
		} else if (previousUsername !== username) {
			addNotice(`Você agora é ${username}`)
		}
	})
}
