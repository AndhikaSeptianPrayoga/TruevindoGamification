import { Router, type Request, type Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { quizService } from './quiz.service.js'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  void quizService
    .getAll()
    .then((data) =>
      res.status(StatusCodes.OK).json({
        success: true,
        data,
      }),
    )
    .catch((error) =>
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat quiz',
      }),
    )
})

router.post('/draft', (_req: Request, res: Response) => {
  void quizService
    .createDraft()
    .then((data) =>
      res.status(StatusCodes.CREATED).json({
        success: true,
        data,
      }),
    )
    .catch((error) =>
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal membuat draft quiz',
      }),
    )
})

router.get('/:quizId', (req: Request, res: Response) => {
  void quizService
    .getById(req.params.quizId)
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Quiz tidak ditemukan',
        })
        return
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: quiz,
      })
    })
    .catch((error) =>
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat detail quiz',
      }),
    )
})

router.patch('/:quizId', (req: Request, res: Response) => {
  void quizService
    .save(req.params.quizId, req.body)
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Quiz tidak ditemukan untuk disimpan',
        })
        return
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: quiz,
      })
    })
    .catch((error) =>
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menyimpan quiz',
      }),
    )
})

router.post('/:quizId/duplicate', (req: Request, res: Response) => {
  void quizService
    .duplicate(req.params.quizId)
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Quiz tidak ditemukan untuk diduplikasi',
        })
        return
      }

      res.status(StatusCodes.CREATED).json({
        success: true,
        data: quiz,
      })
    })
    .catch((error) =>
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menduplikasi quiz',
      }),
    )
})

router.post('/:quizId/status', (req: Request, res: Response) => {
  const { status } = req.body as { status?: 'draft' | 'published' | 'archived' }

  if (!status) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      error: 'Status quiz tidak valid',
    })
    return
  }

  void quizService
    .updateStatus(req.params.quizId, status)
    .then((quiz) => {
      if (!quiz) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Quiz tidak ditemukan untuk diperbarui statusnya',
        })
        return
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: quiz,
      })
    })
    .catch((error) =>
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memperbarui status quiz',
      }),
    )
})

router.delete('/:quizId', (req: Request, res: Response) => {
  void quizService
    .delete(req.params.quizId)
    .then((success) => {
      if (!success) {
        res.status(StatusCodes.NOT_FOUND).json({
          success: false,
          error: 'Quiz tidak ditemukan untuk dihapus',
        })
        return
      }

      res.status(StatusCodes.OK).json({
        success: true,
        data: { id: req.params.quizId },
      })
    })
    .catch((error) =>
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        error: error instanceof Error ? error.message : 'Gagal menghapus quiz',
      }),
    )
})

export default router
