import { Request, Response, NextFunction } from 'express'

export const inquilinoOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user as { rol: string }

  if (!user || user.rol !== 'inquilino') {
    return res
      .status(403)
      .json({ message: 'Acceso denegado, solo inquilinos.' })
  }
  next()
}