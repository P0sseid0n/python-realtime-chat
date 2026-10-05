import { connect } from './socket'
import { initForm } from './ui/form'
import { generateRandomUsername } from './utils'

// http://192.168.100.226:5173/

initForm()
connect('ws://192.168.100.226:3000', generateRandomUsername())
