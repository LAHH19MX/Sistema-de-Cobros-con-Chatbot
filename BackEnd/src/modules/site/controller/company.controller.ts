import { Request, Response } from 'express';
import {prisma} from '../../../db/client';
import {
  createCompanySchema,
  createRedSocialSchema
} from '../schemas/company.schemas'

// actualizar datos de empresa
export const updateEmpresa = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const {
      nombre_empresa,
      logo_empresa,
      telefono_empresa,
      email_empresa,
      estado_empresa,
      ciudad_empresa,
      codigo_postal_empresa,
      calle_empresa,
      colonia_empresa,
      latitud_empresa,
      longitud_empresa
    } = createCompanySchema.parse(req.body)
    
    const empresa = await prisma.empresa.update({
      where: { id_empresa: id },
      data: {
        nombre_empresa,
        logo_empresa,
        telefono_empresa,
        email_empresa,
        estado_empresa,
        ciudad_empresa,
        codigo_postal_empresa,
        calle_empresa,
        colonia_empresa,
        latitud_empresa,
        longitud_empresa
      }
    })
    res.json(empresa)
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando empresa' })
  }
}

// Obtener datos de empresa
export const getEmpresa = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const empresa = await prisma.empresa.findUnique({
      where: { id_empresa: id }
    })
    if (!empresa) {
      return res.status(404).json({ error: 'Datos de empresa no encontrados' })
    }
    res.json(empresa)
  } catch {
    res.status(500).json({ error: 'Error obteniendo datos de empresa' })
  }
}

// agregar red social
export const addRedSocial = async (req: Request<{ empresaId: string }>, res: Response) => {
  try {
    const { empresaId } = req.params
    const { nombre_red, logo_red, enlace } = createRedSocialSchema.parse({
      ...req.body,
      id_empresa: empresaId
    })

    const redSocial = await prisma.redSocial.create({
      data: {
        nombre_red,
        logo_red,
        enlace,
        id_empresa: empresaId
      }
    })

    res.status(201).json(redSocial)
  } catch (error) {
    res.status(500).json({ error: 'Error agregando red social' })
  }
}

// Actualizar red social
export const updateRedSocial = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { nombre_red, logo_red, enlace, id_empresa } = createRedSocialSchema.parse(req.body)

    const redSocial = await prisma.redSocial.update({
      where: { id_red: id },
      data: { nombre_red, logo_red, enlace, id_empresa }
    })
    res.json(redSocial)
  } catch {
    res.status(500).json({ error: 'Error actualizando red social' })
  }
}

// Traer todas las redes sociales
export const getAllRedes = async (_req: Request, res: Response) => {
  try {
    const redes = await prisma.redSocial.findMany()
    res.json(redes)
  } catch {
    res.status(500).json({ error: 'Error obteniendo redes sociales' })
  }
}

// Traer red social por id
export const getRedSocialById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const red = await prisma.redSocial.findUnique({ where: { id_red: id } })
    if (!red) {
      return res.status(404).json({ error: 'Red social no encontrada' })
    }
    res.json(red)
  } catch {
    res.status(500).json({ error: 'Error obteniendo red social' })
  }
}

// Eliminar red social
export const deleteRedSocial = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    await prisma.redSocial.delete({ where: { id_red: id } })
    res.status(204).send()
  } catch {
    res.status(500).json({ error: 'Error eliminando red social' })
  }
}