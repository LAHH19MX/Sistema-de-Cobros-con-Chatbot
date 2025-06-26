import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { createAccessToken } from '../../../common/libs/jwt'
import { prisma } from '../../../db/client'
import { loginSchema } from '../schemas/auth.schemas'

export const login = async (req: Request, res: Response) => {
  try {
    const { email, contra } = loginSchema.parse(req.body)

    // si es admin...
    const admin = await prisma.admin.findUnique({ where: { email_admin: email } })
    if (admin) {
      const match = await bcrypt.compare(contra, admin.password)
      if (!match) return res.status(400).json({ message: 'Contraseña incorrecta' })
      const token = createAccessToken({
        id: admin.id_admin,
        rol: 'admin',
        nombre: `${admin.nombre_admin} ${admin.apellido_paterno_admin}`
      })
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
      })
      return res.json({
        id: admin.id_admin,
        rol: 'admin',
        nombre: admin.nombre_admin,
        apellido_paterno: admin.apellido_paterno_admin,
        apellido_materno: admin.apellido_materno_admin,
        email: admin.email_admin
      })
    }

    // si no es admin...
    const inq = await prisma.inquilino.findUnique({ where: { email_inquilino: email } })
    if (!inq) return res.status(400).json({ message: 'Usuario no encontrado' })
    const matchInq = contra === inq.password ? true : false;

    if (!matchInq) return res.status(400).json({ message: 'Contraseña incorrecta' })
    const token = createAccessToken({
      id: inq.id_inquilino,
      rol: 'inquilino',
      nombre: `${inq.nombre_inquilino} ${inq.apellido_paterno}`
    })
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000
    })
    return res.json({
      id: inq.id_inquilino,
      rol: 'inquilino',
      nombre: inq.nombre_inquilino,
      apellido_paterno: inq.apellido_paterno,
      apellido_materno: inq.apellido_materno,
      email: inq.email_inquilino
    })
  } catch (err) {
    if (err instanceof Error && 'errors' in err) {
      return res.status(400).json({ errors: err.errors })
    }
    return res.status(500).json({ message: 'Error en el login' })
  }
}

export const logout = (_: Request, res: Response) => {
  res.cookie('token', '', { expires: new Date(0) })
  return res.sendStatus(200)
}
