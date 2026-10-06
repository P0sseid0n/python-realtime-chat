import { onSocketEvent } from '../socket'

// Sem um novo TYPING nesse intervalo, a pessoa é considerada parada
const TYPING_TIMEOUT = 3000

const indicator = document.querySelector('#typing-indicator')!

// Quem está digitando agora (nome -> timer que remove o aviso)
const typingUsers = new Map<string, ReturnType<typeof setTimeout>>()

const typingEvents = new EventTarget()

/** Avisa quando a lista de quem está digitando muda (usado pela lista de online). */
export function onTypingChange(listener: (usernames: string[]) => void) {
	typingEvents.addEventListener('change', () => listener([...typingUsers.keys()]))
}

function render() {
	const names = [...typingUsers.keys()]

	if (names.length === 0) indicator.textContent = ''
	else if (names.length === 1) indicator.textContent = `${names[0]} está digitando...`
	else if (names.length === 2) indicator.textContent = `${names[0]} e ${names[1]} estão digitando...`
	else indicator.textContent = 'Várias pessoas estão digitando...'

	typingEvents.dispatchEvent(new Event('change'))
}

function startTyping(username: string) {
	clearTimeout(typingUsers.get(username))
	typingUsers.set(username, setTimeout(() => stopTyping(username), TYPING_TIMEOUT))
	render()
}

function stopTyping(username: string) {
	if (!typingUsers.has(username)) return

	clearTimeout(typingUsers.get(username))
	typingUsers.delete(username)
	render()
}

function clearAll() {
	for (const timer of typingUsers.values()) clearTimeout(timer)
	typingUsers.clear()
	render()
}

export function initTyping() {
	onSocketEvent('userTyping', ({ username }) => startTyping(username))
	// Quando a mensagem chega, a pessoa terminou de digitar
	onSocketEvent('messageReceived', ({ author }) => stopTyping(author))
	onSocketEvent('userLeft', ({ username }) => stopTyping(username))
	onSocketEvent('usernameChanged', ({ oldUsername }) => stopTyping(oldUsername))
	onSocketEvent('statusChange', status => {
		if (status !== 'online') clearAll()
	})
}
