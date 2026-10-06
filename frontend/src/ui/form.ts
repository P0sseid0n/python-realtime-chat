import { onSocketEvent, sendChatMessage } from '../socket'

const form = document.querySelector<HTMLFormElement>('#composer')!
const sendButton = form.querySelector('button')!
const input = form.querySelector<HTMLInputElement>('input#message')!

const state = {
	isOnline: false,
	hasUsername: false,
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

	form.addEventListener('submit', event => {
		event.preventDefault()

		const value = input.value.trim()
		if (!value) return

		if (sendChatMessage(value)) input.value = ''
	})
}
