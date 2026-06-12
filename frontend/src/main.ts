import * as form from './components/form'
import { createJSONClientMessage, getParsedServerMessage } from './utils'

document.querySelector('form')!.addEventListener('submit', event => form.handleSubmit(event, socket))

const socket = new WebSocket('ws://192.168.100.226:3000')
// http://192.168.100.226:5173/

socket.onopen = () => {
	console.log('Conectado ao servidor WebSocket')
	form.setConnectionState('online')

	socket.send(createJSONClientMessage('SET_USERNAME', { username: form.state.username }))
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
		form.addMessageOnChat('in', message.text, message.author)
	} else if (message.event === 'ACK') {
		const resolve = form.pendingMessages[message.message_id]
		if (resolve) {
			resolve()
			delete form.pendingMessages[message.message_id]
		}
	}
}

socket.onclose = () => {
	form.setConnectionState('offline')
}

socket.onerror = () => {
	form.setConnectionState('offline')
}
