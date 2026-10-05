import { onSocketEvent, sendChatMessage, type ConnectionStatus } from '../socket'
import { createMessageElement } from '../utils'
import { StatusLabels } from '../constants'

// Seleção de elementos do DOM
const form = document.querySelector('form')!
const sendButton = form.querySelector('button')!
const chat = document.querySelector('#chat')!
const input = document.querySelector<HTMLInputElement>('input#message')!
const statusContainer = document.querySelector('#status')!
const statusText = statusContainer.querySelector('.status-text')!

const state = {
	status: 'connecting' as ConnectionStatus,
	isSending: false,
}

// Funções puras de manipulação de DOM
function addMessage(variant: 'in' | 'out', text: string, author: string = 'Você') {
	const messageElement = createMessageElement(author, text, variant)

	chat.appendChild(messageElement)
	chat.scrollTop = chat.scrollHeight
}

function updateFormState() {
	form.classList.toggle('is-sending', state.isSending)
	sendButton.disabled = state.status !== 'online' || state.isSending
}

function setConnectionStatus(newState: ConnectionStatus) {
	for (const status of Object.keys(StatusLabels)) {
		statusContainer.classList.remove(`is-${status}`)
	}

	statusContainer.classList.add(`is-${newState}`)
	statusText.textContent = StatusLabels[newState] || StatusLabels.connecting

	state.status = newState
	updateFormState()
}

function setSending(isSending: boolean) {
	state.isSending = isSending
	updateFormState()
}

export function initForm() {
	setConnectionStatus('connecting')

	onSocketEvent('statusChange', setConnectionStatus)
	onSocketEvent('sendingChange', setSending)
	onSocketEvent('messageSent', text => addMessage('out', text))
	onSocketEvent('messageReceived', ({ author, text }) => addMessage('in', text, author))

	form.addEventListener('submit', event => {
		event.preventDefault()

		const value = input.value.trim()
		if (!value) return

		if (sendChatMessage(value)) input.value = ''
	})
}
