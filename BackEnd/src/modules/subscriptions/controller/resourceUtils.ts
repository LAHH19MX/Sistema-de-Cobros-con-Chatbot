import { prisma } from '../../../db/client';
type ResourceType = 'whatsapp' | 'email' | 'clientes' | 'api';

// Función para incrementar uso de recursos
export const incrementResourceUsage = async (
  inquilinoId: string,
  resourceType: ResourceType
): Promise<{ success: boolean; message?: string; currentUsage?: number; limit?: number }> => {
  try {
    // Buscar suscripción activa
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: 'activa'
      },
      include: {
        Planes: true,
        Recursos: true
      }
    });

    if (!suscripcion) {
      return {
        success: false,
        message: 'No tienes una suscripción activa'
      };
    }

    const recursos = suscripcion.Recursos[0];
    const plan = suscripcion.Planes;

    if (!recursos) {
      return {
        success: false,
        message: 'No se encontraron datos de recursos'
      };
    }

    // Verificar límite antes de incrementar
    let currentUsage: number;
    let limit: number | boolean;
    let updateField: any;

    switch (resourceType) {
      case 'whatsapp':
        currentUsage = recursos.whatsapp_usado;
        limit = plan.limites_whatsapp;
        updateField = { whatsapp_usado: { increment: 1 } };
        break;
      case 'email':
        currentUsage = recursos.email_usado;
        limit = plan.limites_email;
        updateField = { email_usado: { increment: 1 } };
        break;
      case 'clientes':
        currentUsage = recursos.clientes_usado;
        limit = plan.limites_clientes || 0;
        updateField = { clientes_usado: { increment: 1 } };
        break;
      case 'api':
        currentUsage = recursos.llamadas_api_usado;
        limit = plan.limites_api;
        if (!limit) {
          return {
            success: false,
            message: 'Tu plan no incluye acceso a la API'
          };
        }
        updateField = { llamadas_api_usado: { increment: 1 } };
        break;
      default:
        return {
          success: false,
          message: 'Tipo de recurso inválido'
        };
    }

    // Para API (booleano), si tiene acceso, permitir
    if (resourceType === 'api' && typeof limit === 'boolean') {
      if (limit) {
        // Incrementar sin verificar límite numérico
        await prisma.recursos.updateMany({
          where: { id_suscripcion: suscripcion.id_suscripcion },
          data: {
            ...updateField,
            fecha_actualizacion: new Date()
          }
        });

        return {
          success: true,
          currentUsage: currentUsage + 1,
          limit: -1 // -1 indica ilimitado
        };
      }
    }

    // Para recursos con límite numérico
    if (typeof limit === 'number' && currentUsage >= limit) {
      return {
        success: false,
        message: `Has alcanzado el límite de ${resourceType} (${limit})`,
        currentUsage,
        limit
      };
    }

    // Incrementar uso
    await prisma.recursos.updateMany({
      where: { id_suscripcion: suscripcion.id_suscripcion },
      data: {
        ...updateField,
        fecha_actualizacion: new Date()
      }
    });

    return {
      success: true,
      currentUsage: currentUsage + 1,
      limit: typeof limit === 'number' ? limit : -1
    };

  } catch (error) {
    console.error('Error al incrementar uso de recursos:', error);
    return {
      success: false,
      message: 'Error interno del servidor'
    };
  }
};

// Función para verificar si puede usar un recurso (sin incrementar)
export const canUseResource = async (
  inquilinoId: string,
  resourceType: ResourceType
): Promise<{ canUse: boolean; message?: string; remaining?: number }> => {
  try {
    // Buscar suscripción activa
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: 'activa'
      },
      include: {
        Planes: true,
        Recursos: true
      }
    });

    if (!suscripcion) {
      return {
        canUse: false,
        message: 'No tienes una suscripción activa'
      };
    }

    const recursos = suscripcion.Recursos[0];
    const plan = suscripcion.Planes;

    if (!recursos) {
      return {
        canUse: false,
        message: 'No se encontraron datos de recursos'
      };
    }

    // Verificar según el tipo de recurso
    switch (resourceType) {
      case 'whatsapp':
        const whatsappRemaining = plan.limites_whatsapp - recursos.whatsapp_usado;
        return {
          canUse: whatsappRemaining > 0,
          message: whatsappRemaining > 0 ? undefined : 'Límite de WhatsApp alcanzado',
          remaining: whatsappRemaining
        };

      case 'email':
        const emailRemaining = plan.limites_email - recursos.email_usado;
        return {
          canUse: emailRemaining > 0,
          message: emailRemaining > 0 ? undefined : 'Límite de emails alcanzado',
          remaining: emailRemaining
        };

      case 'clientes':
        const clientesLimit = plan.limites_clientes || 0;
        const clientesRemaining = clientesLimit - recursos.clientes_usado;
        return {
          canUse: clientesRemaining > 0,
          message: clientesRemaining > 0 ? undefined : 'Límite de clientes alcanzado',
          remaining: clientesRemaining
        };

      case 'api':
        return {
          canUse: plan.limites_api,
          message: plan.limites_api ? undefined : 'Tu plan no incluye acceso a la API',
          remaining: plan.limites_api ? -1 : 0
        };

      default:
        return {
          canUse: false,
          message: 'Tipo de recurso inválido'
        };
    }

  } catch (error) {
    console.error('Error al verificar recurso:', error);
    return {
      canUse: false,
      message: 'Error interno del servidor'
    };
  }
};

// Función para obtener resumen de recursos de un inquilino
export const getResourceSummary = async (inquilinoId: string) => {
  try {
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: 'activa'
      },
      include: {
        Planes: true,
        Recursos: true
      }
    });

    if (!suscripcion) {
      return null;
    }

    const recursos = suscripcion.Recursos[0];
    const plan = suscripcion.Planes;

    if (!recursos) {
      return null;
    }

    return {
      whatsapp: {
        usado: recursos.whatsapp_usado,
        limite: plan.limites_whatsapp,
        restante: plan.limites_whatsapp - recursos.whatsapp_usado,
        porcentaje: Math.round((recursos.whatsapp_usado / plan.limites_whatsapp) * 100)
      },
      email: {
        usado: recursos.email_usado,
        limite: plan.limites_email,
        restante: plan.limites_email - recursos.email_usado,
        porcentaje: Math.round((recursos.email_usado / plan.limites_email) * 100)
      },
      clientes: {
        usado: recursos.clientes_usado,
        limite: plan.limites_clientes || 0,
        restante: Math.max(0, (plan.limites_clientes || 0) - recursos.clientes_usado),
        porcentaje: plan.limites_clientes ? Math.round((recursos.clientes_usado / plan.limites_clientes) * 100) : 0
      },
      api: {
        usado: recursos.llamadas_api_usado,
        acceso: plan.limites_api,
        mensaje: plan.limites_api ? 'Acceso disponible' : 'Sin acceso'
      }
    };

  } catch (error) {
    console.error('Error al obtener resumen de recursos:', error);
    return null;
  }
};