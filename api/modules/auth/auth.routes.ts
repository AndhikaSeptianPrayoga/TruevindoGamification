import { Router, type Request, type Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { authService } from './auth.service.js'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  const { email = 'admin@truevindo.games', password = 'demo-password' } = req.body
  const payload = authService.login({ email, password })

  if (!payload) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      error: 'Email atau password admin tidak valid',
    })
    return
  }

  res.status(StatusCodes.OK).json({
    success: true,
    data: payload,
  })
})

export default router
