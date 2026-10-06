import { connect } from './socket'
import { initForm } from './ui/form'
import { initMessages } from './ui/messages'
import { initStatus } from './ui/status'
import { initUsername } from './ui/username'

// http://192.168.100.226:5173/

initStatus()
initMessages()
initForm()
initUsername()
connect('ws://192.168.100.226:3000')
