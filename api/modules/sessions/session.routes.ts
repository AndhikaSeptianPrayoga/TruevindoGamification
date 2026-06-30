import { Router, type Request, type Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { sessionService } from './session.service.js'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = await sessionService.createSession(req.body)
    res.status(StatusCodes.CREATED).json({
      success: true,
      data,
    })
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: error instanceof Error ? error.message : 'Gagal membuat sesi',
    })
  }
})

router.get('/:sessionId/state', (req: Request, res: Response) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: sessionService.getStateById(req.params.sessionId),
    })
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sesi tidak ditemukan',
    })
  }
})

router.post('/:sessionId/start', (_req: Request, res: Response) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: sessionService.advanceSession(_req.params.sessionId),
    })
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sesi tidak ditemukan',
    })
  }
})

router.post('/:sessionId/next', (_req: Request, res: Response) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: sessionService.advanceSession(_req.params.sessionId),
    })
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sesi tidak ditemukan',
    })
  }
})

router.post('/:sessionId/finish', (_req: Request, res: Response) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: sessionService.advanceStatus(_req.params.sessionId, 'completed'),
    })
  } catch (error) {
    res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      error: error instanceof Error ? error.message : 'Sesi tidak ditemukan',
    })
  }
})

export default router
