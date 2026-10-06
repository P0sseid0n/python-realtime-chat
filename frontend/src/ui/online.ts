import { onSocketEvent } from '../socket'
import { onTypingChange } from './typing'

const list = document.querySelector('#online-list')!
const count = document.querySelector('#online-count')!
const summary = document.querySelector<HTMLElement>('#online-summary')!

const state = {
	users: new Set<string>(),
	typing: new Set<string>(),
	self: null as string | null,
}

function render() {
	// Você primeiro, depois os outros em ordem alfabética
	const others = [...state.users].filter(name => name !== state.self).sort((a, b) => a.localeCompare(b))
	const names = state.self !== null && state.users.has(state.self) ? [state.self, ...others] : others

	list.replaceChildren(
		...names.map(name => {
			const item = document.createElement('li')
			item.textContent = name
			item.title = name
			item.classList.toggle('is-self', name === state.self)
			item.classList.toggle('is-typing', state.typing.has(name))
			return item
		}),
	)

	count.textContent = String(names.length)
	summary.textContent = `${names.length} online`
	summary.hidden = names.length === 0
}

function renameUser(oldName: string, newName: string) {
	state.users.delete(oldName)
	state.users.add(newName)
}

export function initOnline() {
	onSocketEvent('userList', ({ usernames }) => {
		state.users = new Set(usernames)
		render()
	})
	onSocketEvent('userJoined', ({ username }) => {
		state.users.add(username)
		render()
	})
	onSocketEvent('userLeft', ({ username }) => {
		state.users.delete(username)
		render()
	})
	onSocketEvent('usernameChanged', ({ oldUsername, newUsername }) => {
		renameUser(oldUsername, newUsername)
		render()
	})
	onSocketEvent('usernameStatus', ({ username, status, previousUsername }) => {
		if (status !== 'accepted') return

		if (previousUsername !== null) renameUser(previousUsername, username)
		else state.users.add(username)
		state.self = username
		render()
	})
	onSocketEvent('statusChange', status => {
		// Sem conexão a lista fica desatualizada; ela volta com o USER_LIST ao reconectar
		if (status === 'online') return
		state.users.clear()
		state.self = null
		render()
	})

	onTypingChange(usernames => {
		state.typing = new Set(usernames)
		render()
	})

	render()
}
