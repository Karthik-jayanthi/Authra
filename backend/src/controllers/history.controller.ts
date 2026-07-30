import type { Request, Response } from 'express'
import { Verification } from '../models/Verification.js'

export async function listHistory(req: Request, res: Response) {
  const entries = await Verification.find({ user: req.user!.sub })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  res.json({ status: 'ok', history: entries })
}

export async function deleteHistoryEntry(req: Request, res: Response) {
  await Verification.deleteOne({ _id: req.params.id, user: req.user!.sub })
  res.json({ status: 'ok' })
}
