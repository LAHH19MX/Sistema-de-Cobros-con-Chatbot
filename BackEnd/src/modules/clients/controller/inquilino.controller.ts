import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import { UpdateInquilinoInput, updateInquilinoSchema } from '../schemas/inquilino.schemas';

export const getAllInquilinosWithPlans = async (_: Request, res: Response) => {
  try {
    const inquilinos = await prisma.inquilino.findMany({
      select: {
        id_inquilino: true,
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true,
        email_inquilino: true,
        telefono_inquilino: true,
        estado_inquilino: true,
        fecha_registro: true,
        suscripciones: {
          take: 1,
          orderBy: { fecha_inicio: 'desc' },
          select: {
            estado_suscripcion: true,
            fecha_inicio: true,
            fecha_renovacion: true,
            planes: {
              select: {
                nombre_plan: true,
                precio_plan: true
              }
            }
          }
        }
      }
    });

    const formatted = inquilinos.map(inq => ({
      id: inq.id_inquilino,
      nombre: inq.nombre_inquilino,
      apellido_paterno: inq.apellido_paterno,
      apellido_materno: inq.apellido_materno,
      email: inq.email_inquilino,
      telefono: inq.telefono_inquilino,
      estado: inq.estado_inquilino,
      fecha_registro: inq.fecha_registro,
      suscripcion: inq.suscripciones[0] ? {
        estado: inq.suscripciones[0].estado_suscripcion,
        fecha_inicio: inq.suscripciones[0].fecha_inicio,
        fecha_renovacion: inq.suscripciones[0].fecha_renovacion,
        plan: inq.suscripciones[0].planes.nombre_plan,
        precio: inq.suscripciones[0].planes.precio_plan
      } : null
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error al obtener inquilinos:', error);
    res.status(500).json({ 
      error: 'Error interno al obtener la lista de inquilinos',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getInquilinoByIdWithPlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino: id },
      select: {
        id_inquilino: true,
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true,
        email_inquilino: true,
        telefono_inquilino: true,
        direccion_inquilino: true,
        estado_inquilino: true,
        fecha_registro: true,
        foto_inquilino: true,
        suscripciones: {
          take: 1,
          orderBy: { fecha_inicio: 'desc' },
          select: {
            estado_suscripcion: true,
            fecha_inicio: true,
            fecha_renovacion: true,
            planes: {
              select: {
                id_plan: true,
                nombre_plan: true,
                descripcion_plan: true,
                precio_plan: true
              }
            }
          }
        }
      }
    });

    if (!inquilino) {
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }

    const response = {
      ...inquilino,
      suscripcion: inquilino.suscripciones[0] ? {
        estado: inquilino.suscripciones[0].estado_suscripcion,
        fecha_inicio: inquilino.suscripciones[0].fecha_inicio,
        fecha_renovacion: inquilino.suscripciones[0].fecha_renovacion,
        plan: inquilino.suscripciones[0].planes
      } : null
    };

    res.json(response);
  } catch (error: any) {
    console.error('Error al obtener inquilino:', error);
    res.status(500).json({ 
      error: 'Error interno al obtener el inquilino',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const updateInquilino = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validationResult = updateInquilinoSchema.safeParse(req.body);

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        detalles: validationResult.error.flatten()
      });
    }

    // Validación adicional manual
    if (!Object.values(req.body).some(val => val !== undefined)) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    const data: UpdateInquilinoInput = validationResult.data;
    
    const updatedInquilino = await prisma.inquilino.update({
      where: { id_inquilino: id },
      data: {
        nombre_inquilino: data.nombre_inquilino,
        apellido_paterno: data.apellido_paterno,
        apellido_materno: data.apellido_materno,
        email_inquilino: data.email_inquilino,
        telefono_inquilino: data.telefono_inquilino,
        direccion_inquilino: data.direccion_inquilino,
        estado_inquilino: data.estado_inquilino,
        foto_inquilino: data.foto_inquilino
      }
    });

    if (data.plan_id || data.estado_suscripcion || data.fecha_renovacion) {
      await prisma.suscripciones.updateMany({
        where: { 
          id_inquilino: id,
          estado_suscripcion: 'active'
        },
        data: {
          id_plan: data.plan_id,
          estado_suscripcion: data.estado_suscripcion,
          fecha_renovacion: data.fecha_renovacion,
          actualizado_en: new Date()
        }
      });
    }

    const result = await prisma.inquilino.findUnique({
      where: { id_inquilino: id },
      include: {
        suscripciones: {
          take: 1,
          orderBy: { fecha_inicio: 'desc' },
          include: { planes: true }
        }
      }
    });

    res.json({
      ...result,
      suscripcion: result?.suscripciones[0] || null
    });
  } catch (error: any) {
    console.error('Error al actualizar inquilino:', error);
    res.status(500).json({ 
      error: 'Error interno al actualizar el inquilino',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getPlanStatistics = async (_: Request, res: Response) => {
  try {
    const [planes, counts] = await Promise.all([
      prisma.planes.findMany(),
      prisma.suscripciones.groupBy({
        by: ['id_plan'],
        _count: { id_suscripcion: true },
        where: { estado_suscripcion: 'active' }
      })
    ]);

    const stats = planes.map(plan => {
      const countData = counts.find(c => c.id_plan === plan.id_plan);
      const count = countData?._count.id_suscripcion || 0;
      
      return {
        id_plan: plan.id_plan,
        nombre_plan: plan.nombre_plan,
        precio_plan: plan.precio_plan,
        cantidad_inquilinos: count,
        ingresos_totales: Number(plan.precio_plan) * count
      };
    });

    const totales = {
      total_inquilinos: stats.reduce((sum, item) => sum + item.cantidad_inquilinos, 0),
      total_ingresos: stats.reduce((sum, item) => sum + item.ingresos_totales, 0)
    };

    res.json({ estadisticas: stats, totales });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      error: 'Error interno al obtener estadísticas',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};