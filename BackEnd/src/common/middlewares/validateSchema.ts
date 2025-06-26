// src/common/middlewares/validator.middleware.ts
import { AnyZodObject, ZodError } from 'zod'
import { Request, Response, NextFunction } from 'express'

export const validateSchema = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => e.message)
        return res.status(400).json({ errors: messages })
      }
      return res.status(500).json({ message: 'Validation failed' })
    }
  }
}
