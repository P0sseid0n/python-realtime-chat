import { createJSONClientMessage, generateRandomUsername, getParsedServerMessage, createMessageElement } from './utils'

const chat = document.getElementById('chat')!
const form = document.querySelector('form')!
const input = document.getElementById('message') as HTMLInputElement
const statusContainer = document.getElementById('status')!
const statusText = statusContainer.querySelector('.status-text')!
const sendButton = form.querySelector('button') as HTMLButtonElement

const statusLabels = {
	connecting: 'Conectando...',
	online: 'Online agora',
	offline: 'Conexao perdida',
} as const

let isConnected = false
let isSending = false

const username = generateRandomUsername()

function addMessage(author: string, text: string, variant: 'in' | 'out') {
	const messageElement = createMessageElement(author, text, variant)

	chat.appendChild(messageElement)
	chat.scrollTop = chat.scrollHeight
}

function updateFormState() {
	form.classList.toggle('is-sending', isSending)
	sendButton.disabled = !isConnected || isSending
}

function setConnectionState(state: keyof typeof statusLabels) {
	statusContainer.classList.remove('is-online', 'is-offline', 'is-connecting')
	statusContainer.classList.add(`is-${state}`)
	statusText.textContent = statusLabels[state] || statusLabels.connecting
	isConnected = state === 'online'
	updateFormState()
}

function setSending(next: boolean) {
	isSending = next
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
		socket.send(createJSONClientMessage('SEND_TEXT', { text: value }))
		addMessage(username, value, 'out')
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
		addMessage(message.author, message.text, 'in')
	}
}

socket.onclose = () => {
	setConnectionState('offline')
}

socket.onerror = () => {
	setConnectionState('offline')
}
