import { StatusLabels } from './constants'
import {
	createJSONClientMessage,
	generateRandomUsername,
	getParsedServerMessage,
	createMessageElement,
	createClientMessage,
} from './utils'

const chat = document.getElementById('chat')!
const form = document.querySelector('form')!
const input = document.getElementById('message') as HTMLInputElement
const statusContainer = document.getElementById('status')!
const statusText = statusContainer.querySelector('.status-text')!
const sendButton = form.querySelector('button') as HTMLButtonElement

const state = {
	username: generateRandomUsername(),
	isConnected: false,
	isSending: false,
}
const pendingMessages: { [key: string]: Function } = {}

const username = generateRandomUsername()

function addMessageOnChat(author: string, text: string, variant: 'in' | 'out') {
	const messageElement = createMessageElement(author, text, variant)

	chat.appendChild(messageElement)
	chat.scrollTop = chat.scrollHeight
}

function updateFormState() {
	form.classList.toggle('is-sending', state.isSending)
	sendButton.disabled = !state.isConnected || state.isSending
}

function setConnectionState(newValue: keyof typeof StatusLabels) {
	statusContainer.classList.remove('is-online', 'is-offline', 'is-connecting')
	statusContainer.classList.add(`is-${newValue}`)

	statusText.textContent = StatusLabels[newValue] || StatusLabels.connecting
	state.isConnected = newValue === 'online'

	updateFormState()
}

function setSending(newValue: boolean) {
	state.isSending = newValue
	updateFormState()
}

form.addEventListener('submit', async event => {
	event.preventDefault()

	const value = input.value.trim()
	if (!value) return

	if (socket.readyState !== WebSocket.OPEN) {
		setConnectionState('connecting')
		return
	}

	setSending(true)
	try {
		const clientMessage = createClientMessage<'SEND_TEXT'>({ text: value })
		pendingMessages[clientMessage.id] = () => {
			addMessageOnChat(username, value, 'out')
		}

		socket.send(JSON.stringify(clientMessage))
	} finally {
		setSending(false)
		input.value = ''
	}
})

setConnectionState('connecting')

const socket = new WebSocket('ws://192.168.100.226:3000')
// http://192.168.100.226:5173/

socket.onopen = () => {
	console.log('Conectado ao servidor WebSocket')
	setConnectionState('online')

	socket.send(createJSONClientMessage('SET_USERNAME', { username }))
}

socket.onmessage = event => {
	console.log('Mensagem bruta recebida do servidor:', event.data)
	const message = getParsedServerMessage(event.data)
	console.log('Mensagem recebida do servidor:', message)

	if (!message) {
		console.warn('Mensagem do servidor ignorada por formato inválido')
		return
	}

	if (message.event === 'BROADCAST_TEXT') {
		addMessageOnChat(message.author, message.text, 'in')
	} else if (message.event === 'ACK') {
		const resolve = pendingMessages[message.message_id]
		if (resolve) {
			resolve()
			delete pendingMessages[message.message_id]
		}
	}
}

socket.onclose = () => {
	setConnectionState('offline')
}

socket.onerror = () => {
	setConnectionState('offline')
}
