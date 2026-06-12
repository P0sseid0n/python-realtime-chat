import { StatusLabels } from '../constants'
import { generateRandomUsername, createMessageElement, createClientMessage } from '../utils'

const form = document.querySelector('form')!
const sendButton = form.querySelector('button')!
const chat = document.getElementById('chat')!
const input = document.getElementById('message') as HTMLInputElement
const statusContainer = document.getElementById('status')!
const statusText = statusContainer.querySelector('.status-text')!

export const state = {
	username: generateRandomUsername(),
	isConnected: false,
	isSending: false,
}

export const pendingMessages: { [key: string]: Function } = {}

export function addMessageOnChat(variant: 'out', text: string): void
export function addMessageOnChat(variant: 'in', text: string, author: string): void
export function addMessageOnChat(variant: 'in' | 'out', text: string, author: string = 'Você') {
	const messageElement = createMessageElement(author, text, variant)

	chat.appendChild(messageElement)
	chat.scrollTop = chat.scrollHeight
}

function updateFormState() {
	form.classList.toggle('is-sending', state.isSending)
	sendButton.disabled = !state.isConnected || state.isSending
}

function setSending(newValue: boolean) {
	state.isSending = newValue
	updateFormState()
}

export function setConnectionState(newValue: keyof typeof StatusLabels) {
	statusContainer.classList.remove('is-online', 'is-offline', 'is-connecting')
	statusContainer.classList.add(`is-${newValue}`)

	statusText.textContent = StatusLabels[newValue] || StatusLabels.connecting
	state.isConnected = newValue === 'online'

	updateFormState()
}

setConnectionState('connecting')

export async function handleSubmit(event: Event, socket: { readyState: number; send: (data: string) => void }) {
	event.preventDefault()

	const value = input.value.trim()
	if (!value) return

	if (socket.readyState !== WebSocket.OPEN) {
		setConnectionState('connecting')
		return
	}

	setSending(true)
	try {
		const clientMessage = createClientMessage('SEND_TEXT', { text: value })
		pendingMessages[clientMessage.id] = () => {
			addMessageOnChat('out', value)
		}

		socket.send(JSON.stringify(clientMessage))
	} finally {
		setSending(false)
		input.value = ''
	}
}
