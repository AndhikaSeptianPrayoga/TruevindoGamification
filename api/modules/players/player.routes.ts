import { Router, type Request, type Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { sessionService } from '../sessions/session.service.js'

const router = Router()

router.post('/join', (req: Request, res: Response) => {
  try {
    res.status(StatusCodes.CREATED).json({
      success: true,
      data: sessionService.joinSession(req.body),
    })
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error instanceof Error ? error.message : 'Gagal bergabung ke sesi',
    })
  }
})

router.get('/sessions/:sessionId/state', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).json({
    success: true,
    data: sessionService.getStateById(req.params.sessionId),
  })
})

export default router
