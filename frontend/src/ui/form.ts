import { onSocketEvent, sendChatMessage } from '../socket'

const form = document.querySelector('form')!
const sendButton = form.querySelector('button')!
const input = document.querySelector<HTMLInputElement>('input#message')!

export function initForm() {
	sendButton.disabled = true
	onSocketEvent('statusChange', status => (sendButton.disabled = status !== 'online'))

	form.addEventListener('submit', event => {
		event.preventDefault()

		const value = input.value.trim()
		if (!value) return

		if (sendChatMessage(value)) input.value = ''
	})
}
