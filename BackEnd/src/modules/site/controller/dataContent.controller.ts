import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import {
  createSeccionSchema,
  createContenidoSchema
} from '../schemas/dataContent.schemas';

// Seccion
export const getSeccion = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const s = await prisma.seccion.findUnique({ where: { id_seccion: req.params.id } });
    if (!s) return res.status(404).json({ error: 'Sección no encontrada' });
    res.json(s);
  } catch {
    res.status(500).json({ error: 'Error obteniendo sección' });
  }
};

export const getAllSecciones = async (req: Request<{ categoriaId: string }>, res: Response) => {
  try {
    const list = await prisma.seccion.findMany({ 
      where: { id_categoria: req.params.categoriaId },
      orderBy: { orden: 'asc' } 
    });
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Error obteniendo secciones' });
  }
};

export const createSeccion = async (req: Request<{ categoriaId: string }>, res: Response) => {
  try {
    const {
      titulo_seccion,
      texto_seccion,
      imagen_url,
      activo_seccion,
      tipo_seccion,
      fecha_creacion
    } = createSeccionSchema.parse(req.body);
    const maxOrden = await prisma.seccion.aggregate({
      where: { id_categoria: req.params.categoriaId },
      _max: { orden: true }
    });
    const nuevoOrden = (maxOrden._max.orden || 0) + 10;
    const s = await prisma.seccion.create({
      data: {
        titulo_seccion,
        texto_seccion,
        imagen_url,
        activo_seccion,
        tipo_seccion,
        fecha_creacion,
        id_categoria: req.params.categoriaId,
        orden: nuevoOrden
      }
    });
    res.status(201).json(s);
  } catch {
    res.status(500).json({ error: 'Error creando sección' });
  }
};

export const updateSeccion = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const {
      titulo_seccion,
      texto_seccion,
      imagen_url,
      activo_seccion,
      tipo_seccion,
      fecha_creacion
    } = createSeccionSchema.parse(req.body);
    const s = await prisma.seccion.update({
      where: { id_seccion: req.params.id },
      data: { titulo_seccion, texto_seccion, imagen_url, activo_seccion, tipo_seccion, fecha_creacion }
    });
    res.json(s);
  } catch {
    res.status(500).json({ error: 'Error actualizando sección' });
  }
};

export const deleteSeccion = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.seccion.delete({ where: { id_seccion: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error eliminando sección' });
  }
};

// Contenido
export const getAllContenidos = async (req: Request<{ seccionId: string }>, res: Response) => {
  try {
    const list = await prisma.contenido.findMany({ 
      where: { id_seccion: req.params.seccionId },
      orderBy: { orden: 'asc' }
    });
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Error obteniendo contenidos' });
  }
};

export const getContenidoById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const c = await prisma.contenido.findUnique({ where: { id_contenido: req.params.id } });
    if (!c) return res.status(404).json({ error: 'Contenido no encontrado' });
    res.json(c);
  } catch {
    res.status(500).json({ error: 'Error obteniendo contenido' });
  }
};

export const createContenido = async (req: Request<{ seccionId: string }>, res: Response) => {
  try {
    const { titulo_contenido, texto_contenido, multimedia_url } = createContenidoSchema.parse(req.body);
    const maxOrden = await prisma.contenido.aggregate({
      where: { id_seccion: req.params.seccionId },
      _max: { orden: true }
    });
    const nuevoOrden = (maxOrden._max.orden || 0) + 10;
    const c = await prisma.contenido.create({
      data: { 
        titulo_contenido, 
        texto_contenido, 
        multimedia_url, 
        id_seccion: req.params.seccionId,
        orden: nuevoOrden
      }
    });
    res.status(201).json(c);
  } catch {
    res.status(500).json({ error: 'Error creando contenido' });
  }
};

export const updateContenido = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { titulo_contenido, texto_contenido, multimedia_url } = createContenidoSchema.parse(req.body);
    const c = await prisma.contenido.update({
      where: { id_contenido: req.params.id },
      data: { titulo_contenido, texto_contenido, multimedia_url }
    });
    res.json(c);
  } catch {
    res.status(500).json({ error: 'Error actualizando contenido' });
  }
};

export const deleteContenido = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.contenido.delete({ where: { id_contenido: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error eliminando contenido' });
  }
};
