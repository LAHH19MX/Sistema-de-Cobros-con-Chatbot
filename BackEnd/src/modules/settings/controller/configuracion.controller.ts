import { Request, Response } from 'express'
import { prisma } from '../../../db/client'

// Obtener configuración actual
export const getConfiguracion = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    
    const configuracion = await prisma.configuracion.findFirst({
      where: { id_inquilino }
    })
    
    if (!configuracion) {
      return res.status(404).json({ error: 'Configuración no encontrada' })
    }
    
    res.json(configuracion)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo configuración' })
  }
}

// Actualizar configuración de mensajes
export const updateConfiguracion = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const {
      motivo,
      mensaje_pre_vencimiento,
      mensaje_post_vencimiento,
      frecuencia
    } = req.body
    
    // Buscar configuración existente (siempre debe existir por el trigger)
    const configExistente = await prisma.configuracion.findFirst({
      where: { id_inquilino }
    })
    
    if (!configExistente) {
      return res.status(404).json({ error: 'Configuración no encontrada' })
    }
    
    // Actualizar
    const configuracion = await prisma.configuracion.update({
      where: { id_configuracion: configExistente.id_configuracion },
      data: {
        ...(motivo && { motivo }),
        ...(mensaje_pre_vencimiento && { mensaje_pre_vencimiento }),
        ...(mensaje_post_vencimiento && { mensaje_post_vencimiento }),
        ...(frecuencia && { frecuencia })
      }
    })
    
    res.json({
      message: 'Configuración actualizada exitosamente',
      configuracion
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error actualizando configuración' })
  }
}