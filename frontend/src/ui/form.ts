import { onSocketEvent, sendChatMessage, sendTyping } from '../socket'

// Intervalo mínimo entre dois avisos de "digitando"
const TYPING_THROTTLE = 2000

const form = document.querySelector<HTMLFormElement>('#composer')!
const sendButton = form.querySelector('button')!
const input = form.querySelector<HTMLInputElement>('input#message')!

const state = {
	isOnline: false,
	hasUsername: false,
	lastTypingSentAt: 0,
}

function updateFormState() {
	sendButton.disabled = !state.isOnline || !state.hasUsername
}

export function initForm() {
	updateFormState()

	onSocketEvent('statusChange', status => {
		state.isOnline = status === 'online'
		// Uma nova conexão precisa escolher o nome de novo
		if (!state.isOnline) state.hasUsername = false
		updateFormState()
	})

	onSocketEvent('usernameStatus', ({ status }) => {
		if (status === 'accepted') {
			state.hasUsername = true
			updateFormState()
			input.focus()
		}
	})

	input.addEventListener('input', () => {
		if (!input.value.trim()) return

		const now = Date.now()
		if (now - state.lastTypingSentAt < TYPING_THROTTLE) return

		state.lastTypingSentAt = now
		sendTyping()
	})

	form.addEventListener('submit', event => {
		event.preventDefault()

		const value = input.value.trim()
		if (!value) return

		if (sendChatMessage(value)) {
			input.value = ''
			// A próxima digitação já avisa de novo, sem esperar o intervalo
			state.lastTypingSentAt = 0
		}
	})
}
