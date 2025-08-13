import { Request, Response } from 'express'
import { prisma } from '../../../db/client'

// Listar pasarelas del inquilino (ordenadas: stripe primero, paypal después)
export const getPasarelas = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    
    const pasarelas = await prisma.clave_pasarelas.findMany({
      where: { id_inquilino },
      orderBy: { pasarela: 'desc' } 
    })
    
    res.json(pasarelas)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo pasarelas' })
  }
}

// Crear o actualizar pasarela
export const upsertPasarela = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const {
      pasarela,
      credenciales_api,
      client_secret,
      webhook_secret,  
      webhook_id       
    } = req.body
    
    // Validar requerimientos según tipo de pasarela
    if (pasarela === 'paypal' && !client_secret) {
      return res.status(400).json({ 
        error: 'PayPal requiere tanto credenciales API como client secret' 
      })
    }
    
    // Validar webhook fields
    if (pasarela === 'stripe' && !webhook_secret) {
      return res.status(400).json({ 
        error: 'Stripe requiere webhook secret para recibir notificaciones de pago' 
      })
    }
    
    if (pasarela === 'paypal' && !webhook_id) {
      return res.status(400).json({ 
        error: 'PayPal requiere webhook ID para recibir notificaciones de pago' 
      })
    }
    
    // Buscar si ya existe
    const pasarelaExistente = await prisma.clave_pasarelas.findFirst({
      where: {
        id_inquilino,
        pasarela
      }
    })
    
    let resultado
    
    if (pasarelaExistente) {
      // Actualizar existente
      resultado = await prisma.clave_pasarelas.update({
        where: { id_credencial: pasarelaExistente.id_credencial },
        data: {
          credenciales_api,
          client_secret,
          webhook_secret,     
          webhook_id,        
          estado: 'ACTIVO',
          fecha_actualizacion: new Date()
        }
      })
    } else {
      // Crear nueva
      resultado = await prisma.clave_pasarelas.create({
        data: {
          id_inquilino,
          pasarela,
          credenciales_api,
          client_secret,
          webhook_secret,
          webhook_id,         
          estado: 'ACTIVO'
        }
      })
    }
    
    res.json({
      message: pasarelaExistente ? 'Pasarela actualizada exitosamente' : 'Pasarela creada exitosamente',
      pasarela: resultado
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error procesando pasarela' })
  }
}

// Actualizar estado de pasarela 
export const updateEstadoPasarela = async (req: Request, res: Response) => {
  try {
    const { tipo } = req.params 
    const id_inquilino = (req as any).user.id
    const { estado } = req.body
    
    const pasarela = await prisma.clave_pasarelas.findFirst({
      where: {
        id_inquilino,
        pasarela: tipo as any
      }
    })
    
    if (!pasarela) {
      return res.status(404).json({ error: 'Pasarela no encontrada' })
    }
    
    const actualizada = await prisma.clave_pasarelas.update({
      where: { id_credencial: pasarela.id_credencial },
      data: {
        estado,
        fecha_actualizacion: new Date()
      }
    })
    
    res.json({
      message: `Pasarela ${estado === 'ACTIVO' ? 'activada' : 'desactivada'} exitosamente`,
      pasarela: actualizada
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error actualizando estado' })
  }
}