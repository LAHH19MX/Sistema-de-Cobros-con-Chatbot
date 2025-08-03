import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import { CreatePlanSchema, UpdatePlanSchema } from '../schemas/plans.schemas';

// export const getAllPlans = async (_: Request, res: Response) => {
//   try {
//     const plans = await prisma.planes.findMany({
//       orderBy: { creado_en: 'desc' }
//     });
//     res.json(plans);
//   } catch (error: any) {
//     console.error('Error:', error.message);
//     res.status(500).json({ 
//       error: 'Error al obtener planes',
//       detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plan = await prisma.planes.findUnique({
      where: { id_plan: id }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(plan);
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Error al obtener plan',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// export const createPlan = async (req: Request, res: Response) => {
//   try {
//     const data = CreatePlanSchema.parse(req.body);
//     const newPlan = await prisma.planes.create({
//       data: {
//         ...data,
//         creado_en: new Date(),
//         actualizado_en: new Date()
//       }
//     });
//     res.status(201).json(newPlan);
//   } catch (error: any) {
//     console.error('Error al crear plan:', error.message);
//     res.status(400).json({ 
//       error: 'Error al crear el plan',
//       detalles: error.message
//     });
//   }
// };

export const getActivePlans = async (req: Request, res: Response) => {
  try {
    const planes = await prisma.planes.findMany({
      where: {
        estado_plan: true // Solo planes activos
      },
      select: {
        id_plan: true,
        nombre_plan: true,
        descripcion_plan: true,
        precio_plan: true,
        limites_whatsapp: true,
        limites_email: true,
        limites_api: true,
        limites_clientes: true,
        stripe_price_id: true,
        paypal_plan_id: true
      },
      orderBy: {
        precio_plan: 'asc' // Del más barato al más caro
      }
    });

    // Convertir Decimal a number para el frontend
    const planesFormatted = planes.map(plan => ({
      ...plan,
      precio_plan: Number(plan.precio_plan)
    }));

    return res.json({
      success: true,
      planes: planesFormatted
    });

  } catch (error) {
    console.error('Error obteniendo planes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = UpdatePlanSchema.parse(req.body);
    
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: 'Debe proporcionar al menos un campo para actualizar'
      });
    }

    const updatedPlan = await prisma.planes.update({
      where: { id_plan: id },
      data: {
        ...data,
        actualizado_en: new Date()
      }
    });

    res.json(updatedPlan);
  } catch (error: any) {
    console.error('Error al actualizar plan:', error.message);
    res.status(400).json({ 
      error: 'Error al actualizar el plan',
      detalles: error.message
    });
  }
};

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const activeSubscriptions = await prisma.suscripciones.count({
      where: { 
        id_plan: id,
        estado_suscripcion: 'active'
      }
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({
        error: 'No se puede eliminar el plan, tiene suscripciones activas'
      });
    }

    await prisma.planes.delete({
      where: { id_plan: id }
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: 'Error al eliminar plan',
      detalles: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};