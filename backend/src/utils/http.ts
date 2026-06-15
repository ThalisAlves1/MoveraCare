import { Response } from 'express'
export function badRequest(res: Response, message: string) { return res.status(400).json({ ok: false, message }) }
export function notFound(res: Response, message: string) { return res.status(404).json({ ok: false, message }) }
