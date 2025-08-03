import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';
import { SubscriptionStatus } from '../utils/types';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    rol: string;
    nombre: string;
  };
}

export const requireActiveSubscription = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo verificar suscripción para inquilinos, no para admins
    if (req.user.rol === 'admin') {
      return next();
    }

    const inquilinoId = req.user.id;

    // Buscar suscripción activa del inquilino
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: {
          in: ['activa', 'pago_vencido']
        }
      },
      include: {
        Planes: true, // Incluir datos del plan
        inquilinos: true // Incluir datos del inquilino
      }
    });

    // Si no tiene suscripción
    if (!suscripcion) {
      return res.status(403).json({
        success: false,
        message: 'No tienes una suscripción activa',
        redirectTo: '/planes'
      });
    }

    // Verificar si la suscripción está vencida
    const now = new Date();
    const fechaRenovacion = new Date(suscripcion.fecha_renovacion);
    const diasGracia = 3;
    const fechaLimite = new Date(fechaRenovacion.getTime() + (diasGracia * 24 * 60 * 60 * 1000));

    // Si está vencida y pasó el período de gracia
    if (now > fechaLimite && suscripcion.estado_suscripcion === 'pago_vencido') {
      return res.status(403).json({
        success: false,
        message: 'Tu suscripción ha vencido. Actualiza tu método de pago.',
        redirectTo: '/suscripcion/renovar'
      });
    }

    // Si está en período de gracia, mostrar advertencia pero permitir acceso
    if (now > fechaRenovacion && suscripcion.estado_suscripcion === 'pago_vencido') {
      const diasRestantes = Math.ceil((fechaLimite.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      
      // Agregar advertencia a la respuesta (se puede usar en el frontend)
      res.locals.warning = {
        message: `Tu suscripción vence en ${diasRestantes} días. Actualiza tu método de pago.`,
        type: 'payment_warning',
        daysLeft: diasRestantes
      };
    }

    // Agregar datos de suscripción y plan al request
    req.subscription = {
      id: suscripcion.id_suscripcion,
      status: suscripcion.estado_suscripcion as SubscriptionStatus,
      plan: suscripcion.Planes,
      renewDate: suscripcion.fecha_renovacion,
      gateway: suscripcion.pasarela_pago as 'stripe' | 'paypal'
    };

    next();
  } catch (error) {
    console.error('Error en middleware de suscripción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};