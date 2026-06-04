const chat = document.getElementById('chat')!
const form = document.querySelector('form')!
const input = document.getElementById('message') as HTMLInputElement
const statusContainer = document.getElementById('status')!
const statusText = statusContainer.querySelector('.status-text')!
const sendButton = form.querySelector('button') as HTMLButtonElement

function generateRandomUsername() {
	return 'user_' + Math.random().toString(36).substr(2, 9)
}

const statusLabels = {
	connecting: 'Conectando...',
	online: 'Online agora',
	offline: 'Conexao perdida',
}

let isConnected = false
let isSending = false

const userName = generateRandomUsername()

function getDateTimeFormatted() {
	const now = new Date()

	const hours = now.getHours().toString().padStart(2, '0')
	const minutes = now.getMinutes().toString().padStart(2, '0')

	return `${hours}:${minutes}`
}

function addMessage(text: string, variant: 'in' | 'out') {
	const bubble = document.createElement('div')
	bubble.className = `msg ${variant}`
	bubble.textContent = text

	const meta = document.createElement('span')
	meta.className = 'meta'
	meta.textContent = getDateTimeFormatted()
	bubble.appendChild(meta)

	chat.appendChild(bubble)
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

// function waitForBufferDrain(socket, timeoutMs = 1500) {
// 	return new Promise(resolve => {
// 		if (socket.bufferedAmount === 0) {
// 			resolve()
// 			return
// 		}

// 		const startedAt = Date.now()
// 		const timer = setInterval(() => {
// 			const timedOut = Date.now() - startedAt >= timeoutMs
// 			if (socket.readyState !== WebSocket.OPEN || socket.bufferedAmount === 0 || timedOut) {
// 				clearInterval(timer)
// 				resolve()
// 			}
// 		}, 50)
// 	})
// }

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
		socket.send(value)
		addMessage(value, 'out')
		// const minDelay = new Promise(resolve => setTimeout(resolve, 300))
		// await Promise.all([waitForBufferDrain(socket), minDelay])
	} finally {
		setSending(false)
		input.value = ''
	}
})

setConnectionState('connecting')

const socket = new WebSocket('ws://localhost:3000')

socket.onopen = () => {
	console.log('Conectado ao servidor WebSocket')
	setConnectionState('online')
}

socket.onmessage = event => {
	const message = event.data
	console.log('Mensagem recebida do servidor:', message)
	addMessage(message, 'in')
}

socket.onclose = () => {
	setConnectionState('offline')
}

socket.onerror = () => {
	setConnectionState('offline')
}
