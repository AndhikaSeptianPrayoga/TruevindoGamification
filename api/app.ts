import path from 'path'
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/auth.routes.js'
import quizRoutes from './modules/quizzes/quiz.routes.js'
import sessionRoutes from './modules/sessions/session.routes.js'
import playerRoutes from './modules/players/player.routes.js'

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/admin/auth', authRoutes)
app.use('/api/admin/quizzes', quizRoutes)
app.use('/api/admin/sessions', sessionRoutes)
app.use('/api/player', playerRoutes)

app.get('/api/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    service: 'truevindo-games-api',
  })
})

// In production a single service serves both the API and the built frontend.
// The Vite build output (dist/) is served statically, with an SPA fallback to
// index.html for any non-API route so client-side routing works on refresh.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(process.cwd(), 'dist')
  app.use(express.static(clientDist))
  app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
    detail: error.message,
  })
})

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
