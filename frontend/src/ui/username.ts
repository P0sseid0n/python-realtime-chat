import { onSocketEvent, setUsername, type ConnectionStatus } from '../socket'
import { generateRandomUsername } from '../utils'

const STORAGE_KEY = 'chat:username'
const OFFLINE_MESSAGE = 'Sem conexão com o servidor.'

const dialog = document.querySelector<HTMLDialogElement>('#username-dialog')!
const form = dialog.querySelector('form')!
const title = dialog.querySelector('#username-title')!
const input = dialog.querySelector<HTMLInputElement>('input#username')!
const submitButton = dialog.querySelector<HTMLButtonElement>('#username-submit')!
const cancelButton = dialog.querySelector<HTMLButtonElement>('#username-cancel')!
const errorText = dialog.querySelector('#username-error')!

const currentUser = document.querySelector<HTMLElement>('#current-user')!
const currentUserName = currentUser.querySelector('#current-user-name')!
const changeButton = currentUser.querySelector<HTMLButtonElement>('#change-username')!

const state = {
	status: 'connecting' as ConnectionStatus,
	isWaiting: false,
	// Nome aceito pelo servidor na conexão atual
	username: null as string | null,
}

function loadSavedUsername() {
	try {
		return localStorage.getItem(STORAGE_KEY)
	} catch {
		return null
	}
}

function saveUsername(username: string) {
	try {
		localStorage.setItem(STORAGE_KEY, username)
	} catch {
		// Sem storage disponível o nome só não fica salvo para a próxima visita
	}
}

function updateState() {
	const isOnline = state.status === 'online'
	submitButton.disabled = !isOnline || state.isWaiting
	changeButton.disabled = !isOnline

	if (state.status === 'offline') errorText.textContent = OFFLINE_MESSAGE
	else if (errorText.textContent === OFFLINE_MESSAGE) errorText.textContent = ''

	currentUser.hidden = state.username === null
	currentUserName.textContent = state.username ?? ''
}

function openDialog() {
	const isChanging = state.username !== null

	title.textContent = isChanging ? 'Trocar nome' : 'Como quer ser chamado?'
	submitButton.textContent = isChanging ? 'Salvar' : 'Entrar no chat'
	cancelButton.hidden = !isChanging
	input.value = state.username ?? loadSavedUsername() ?? generateRandomUsername()
	if (state.status !== 'offline') errorText.textContent = ''

	dialog.showModal()
	input.select()
}

export function initUsername() {
	// Sem nome ainda, o diálogo é obrigatório: impede fechar com Esc
	dialog.addEventListener('cancel', event => {
		if (state.username === null) event.preventDefault()
	})
	cancelButton.addEventListener('click', () => dialog.close())
	changeButton.addEventListener('click', openDialog)

	onSocketEvent('statusChange', status => {
		state.status = status
		if (status !== 'online') {
			// O servidor esquece o nome quando a conexão cai
			state.isWaiting = false
			state.username = null
		}
		updateState()
	})

	onSocketEvent('usernameStatus', ({ username, status }) => {
		state.isWaiting = false

		if (status === 'accepted') {
			state.username = username
			saveUsername(username)
			dialog.close()
		} else {
			// Pode acontecer fora do diálogo: ao reconectar, o nome pode ter sido pego por outra pessoa
			if (!dialog.open) openDialog()
			errorText.textContent = `O nome "${username}" não está disponível.`
			input.focus()
			input.select()
		}

		updateState()
	})

	form.addEventListener('submit', event => {
		event.preventDefault()

		const value = input.value.trim()
		if (!value) return

		if (value === state.username) {
			dialog.close()
			return
		}

		if (setUsername(value)) {
			errorText.textContent = ''
			state.isWaiting = true
			updateState()
		}
	})

	updateState()
	openDialog()
}
