const chat = document.getElementById('chat')
const form = document.querySelector('form')
const input = document.getElementById('message')

function getDateTimeFormatted() {
	const now = new Date()

	const hours = now.getHours().toString().padStart(2, '0')
	const minutes = now.getMinutes().toString().padStart(2, '0')

	return `${hours}:${minutes}`
}

function addMessage(text, variant) {
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

form.addEventListener('submit', event => {
	event.preventDefault()

	const value = input.value.trim()
	if (!value) return

	addMessage(value, 'out')

	input.value = ''
})
