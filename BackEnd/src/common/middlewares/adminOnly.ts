import { Request, Response, NextFunction } from 'express'

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { rol: string }

  if (!user || user.rol !== 'admin') {
    return res
      .status(403)
      .json({ message: 'Acceso denegado, solo administradores.' })
  }
  next()
}
