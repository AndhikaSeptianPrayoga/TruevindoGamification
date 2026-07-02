import { createServer } from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { registerSessionGateway } from './gateways/session.gateway.js'
import { registerSpamGateway } from './gateways/spam.gateway.js'
import { registerWheelGateway } from './gateways/wheel.gateway.js'
import { sessionService } from './modules/sessions/session.service.js'

const PORT = Number(process.env.PORT || 3002)

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  },
})

registerSessionGateway(io)
registerWheelGateway(io)
registerSpamGateway(io)
async function bootstrap() {
  const restoredCount = await sessionService.initialize()

  httpServer.listen(PORT, () => {
    console.log(`Truevindo Games API ready on port ${PORT}`)
    console.log(`Recovered ${restoredCount} session registry entr${restoredCount === 1 ? 'y' : 'ies'}`)
  })
}

function shutdown(signal: string) {
  console.log(`${signal} signal received`)
  httpServer.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

void bootstrap()

export default httpServer
