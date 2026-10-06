import { onSocketEvent, type ConnectionStatus } from '../socket'
import { StatusLabels } from '../constants'

const statusContainer = document.querySelector('#status')!
const statusText = statusContainer.querySelector('.status-text')!

function setConnectionStatus(newState: ConnectionStatus) {
	for (const status of Object.keys(StatusLabels)) {
		statusContainer.classList.remove(`is-${status}`)
	}

	statusContainer.classList.add(`is-${newState}`)
	statusText.textContent = StatusLabels[newState] || StatusLabels.connecting
}

export function initStatus() {
	setConnectionStatus('connecting')
	onSocketEvent('statusChange', setConnectionStatus)
}
