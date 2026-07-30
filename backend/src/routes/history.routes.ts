import { Router } from 'express'
import { deleteHistoryEntry, listHistory } from '../controllers/history.controller.js'
import { requireAuth } from '../middleware/auth.middleware.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const historyRouter = Router()

historyRouter.use(requireAuth)
historyRouter.get('/', asyncHandler(listHistory))
historyRouter.delete('/:id', asyncHandler(deleteHistoryEntry))
