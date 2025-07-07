import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import {
  createApartadoSchema,
  createCategoriaSchema
} from '../schemas/dataThemes.schemas';

// apartado
export const getApartado = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const apartado = await prisma.apartado.findUnique({ where: { id_apartado: req.params.id } });
    if (!apartado) return res.status(404).json({ error: 'Apartado no encontrado' });
    res.json(apartado);
  } catch {
    res.status(500).json({ error: 'Error obteniendo apartado' });
  }
};

export const getAllApartados = async (_req: Request, res: Response) => {
  try {
    const apartados = await prisma.apartado.findMany({
      orderBy: { orden: 'asc' }
    });
    res.json(apartados);
  } catch {
    res.status(500).json({ error: 'Error obteniendo apartados' });
  }
};

export const createApartado = async (req: Request, res: Response) => {
  try {
    const {
      nombre_apartado,
      id_empresa,
      id_plantilla,
      activo_apartado,
      mostrar_categoria
    } = createApartadoSchema.parse(req.body);
    const maxOrden = await prisma.apartado.aggregate({
      _max: { orden: true }
    });
    const nuevoOrden = (maxOrden._max.orden || 0) + 10;
    const apartado = await prisma.apartado.create({
      data: { 
        nombre_apartado, 
        id_empresa, 
        id_plantilla, 
        activo_apartado, 
        mostrar_categoria,
        orden: nuevoOrden
      }
    });
    res.status(201).json(apartado);
  } catch {
    res.status(500).json({ error: 'Error creando apartado' });
  }
};

export const updateApartado = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const {
      nombre_apartado,
      id_empresa,
      id_plantilla,
      activo_apartado,
      mostrar_categoria
    } = createApartadoSchema.parse(req.body);
    const apartado = await prisma.apartado.update({
      where: { id_apartado: req.params.id },
      data: { nombre_apartado, id_empresa, id_plantilla, activo_apartado, mostrar_categoria }
    });
    res.json(apartado);
  } catch {
    res.status(500).json({ error: 'Error actualizando apartado' });
  }
};

export const deleteApartado = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.apartado.delete({ where: { id_apartado: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error eliminando apartado' });
  }
};

// categoria
export const getAllCategorias = async (req: Request<{ apartadoId: string }>, res: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { id_apartado: req.params.apartadoId},
      orderBy: { orden: 'asc' }
    });
    res.json(categorias);
  } catch {
    res.status(500).json({ error: 'Error obteniendo categorías' });
  }
};

export const getCategoriaById = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const categoria = await prisma.categoria.findUnique({
      where: { id_categoria: req.params.id }
    });
    if (!categoria) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(categoria);
  } catch {
    res.status(500).json({ error: 'Error obteniendo categoría' });
  }
};

export const createCategoria = async (req: Request<{ apartadoId: string }>, res: Response) => {
  try {
    const {
      nombre_categoria,
      titulo_categoria,
      texto_categoria,
      imagen_categoria,
      activo_categoria
    } = createCategoriaSchema.parse(req.body);
    const maxOrden = await prisma.categoria.aggregate({
      where: { id_apartado: req.params.apartadoId },
      _max: { orden: true }
    });
    const nuevoOrden = (maxOrden._max.orden || 0) + 10;
    const categoria = await prisma.categoria.create({
      data: {
        nombre_categoria,
        titulo_categoria,
        texto_categoria,
        imagen_categoria,
        activo_categoria,
        id_apartado: req.params.apartadoId,
        orden: nuevoOrden
      }
    });
    res.status(201).json(categoria);
  } catch {
    res.status(500).json({ error: 'Error creando categoría' });
  }
};

export const updateCategoria = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const {
      nombre_categoria,
      titulo_categoria,
      texto_categoria,
      imagen_categoria,
      activo_categoria
    } = createCategoriaSchema.parse(req.body);
    const categoria = await prisma.categoria.update({
      where: { id_categoria: req.params.id },
      data: {
        nombre_categoria,
        titulo_categoria,
        texto_categoria,
        imagen_categoria,
        activo_categoria
      }
    });
    res.json(categoria);
  } catch {
    res.status(500).json({ error: 'Error actualizando categoría' });
  }
};

export const deleteCategoria = async (req: Request<{ id: string }>, res: Response) => {
  try {
    await prisma.categoria.delete({ where: { id_categoria: req.params.id } });
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Error eliminando categoría' });
  }
};
