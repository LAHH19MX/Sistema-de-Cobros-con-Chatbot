import { Request, Response } from 'express'
import { prisma } from '../../../db/client'
import bcrypt from 'bcryptjs'

// Obtener datos del perfil
export const getPerfil = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino },
      select: {
        id_inquilino: true,
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true,
        email_inquilino: true,
        telefono_inquilino: true,
        direccion_inquilino: true,
        foto_inquilino: true,
        fecha_registro: true
      }
    })
    
    if (!inquilino) {
      return res.status(404).json({ error: 'Perfil no encontrado' })
    }
    
    res.json(inquilino)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo perfil' })
  }
}

// Actualizar datos del perfil
export const updatePerfil = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const {
      nombre_inquilino,
      apellido_paterno,
      apellido_materno,
      telefono_inquilino,
      direccion_inquilino,
      foto_inquilino
    } = req.body
    
    // Actualizar solo los campos permitidos
    const inquilinoActualizado = await prisma.inquilino.update({
      where: { id_inquilino },
      data: {
        ...(nombre_inquilino && { nombre_inquilino }),
        ...(apellido_paterno && { apellido_paterno }),
        ...(apellido_materno !== undefined && { apellido_materno }),
        ...(telefono_inquilino !== undefined && { telefono_inquilino }),
        ...(direccion_inquilino !== undefined && { direccion_inquilino }),
        ...(foto_inquilino !== undefined && { foto_inquilino })
      },
      select: {
        id_inquilino: true,
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true,
        email_inquilino: true,
        telefono_inquilino: true,
        direccion_inquilino: true,
        foto_inquilino: true
      }
    })
    
    res.json({
      message: 'Perfil actualizado exitosamente',
      perfil: inquilinoActualizado
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error actualizando perfil' })
  }
}

// Cambiar contraseña
export const changePassword = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { password_actual, password_nueva, confirmar_password } = req.body
    
    // Validar que las contraseñas coincidan
    if (password_nueva !== confirmar_password) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden' })
    }
    
    // Obtener inquilino actual con su contraseña
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino },
      select: {
        password: true
      }
    })
    
    if (!inquilino) {
      return res.status(404).json({ error: 'Inquilino no encontrado' })
    }
    
    // Verificar contraseña actual
    const passwordValida = await bcrypt.compare(password_actual, inquilino.password)
    
    if (!passwordValida) {
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' })
    }
    
    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password_nueva, 10)
    
    // Actualizar contraseña
    await prisma.inquilino.update({
      where: { id_inquilino },
      data: {
        password: hashedPassword
      }
    })
    
    res.json({ message: 'Contraseña actualizada exitosamente' })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error actualizando contraseña' })
  }
}