import { Request, Response, NextFunction } from 'express'
import jwt, { VerifyErrors } from 'jsonwebtoken'

export const authRequiered = (req: Request, res: Response, next: NextFunction) => {
  const token = (req as any).cookies?.token
  if (!token) {
    return res.status(401).json({ message: 'No hay token autorizado' })
  }

  jwt.verify(
    token,
    process.env.TOKEN_SECRET as string,
    (err: VerifyErrors | null, decoded: any) => {
      if (err) {
        return res.status(403).json({ message: 'Token inválido' })
      }
      ;(req as any).user = decoded
      next()
    }
  )
}
