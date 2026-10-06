import { connect } from './socket'
import { initForm } from './ui/form'
import { initMessages } from './ui/messages'
import { initStatus } from './ui/status'
import { initUsername } from './ui/username'

// Por padrão conecta na porta 3000 do mesmo host que serviu a página (funciona via localhost e pela rede local)
const WS_URL = import.meta.env.VITE_WS_URL ?? `ws://${location.hostname}:3000`

initStatus()
initMessages()
initForm()
initUsername()
connect(WS_URL)
