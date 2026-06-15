import { Response } from 'express'

export function badRequest(res: Response, message: string) {
  return res.status(400).json({ ok: false, message })
}

export function notFound(res: Response, message: string) {
  return res.status(404).json({ ok: false, message })
}

export function serverError(res: Response, error: unknown, fallback = 'Erro interno no servidor.') {
  const message = error instanceof Error ? error.message : fallback
  return res.status(500).json({ ok: false, message })
}
