import { connect } from './socket'
import { initForm } from './ui/form'
import { initMessages } from './ui/messages'
import { initStatus } from './ui/status'
import { generateRandomUsername } from './utils'

// http://192.168.100.226:5173/

initStatus()
initMessages()
initForm()
connect('ws://192.168.100.226:3000', generateRandomUsername())
