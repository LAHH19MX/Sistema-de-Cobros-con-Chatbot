import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../db/client';

type ResourceType = 'whatsapp' | 'email' | 'api' | 'clientes';

export const checkResourceLimit = (resourceType: ResourceType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.subscription) {
        return res.status(403).json({
          success: false,
          message: 'Suscripción no verificada'
        });
      }

      const suscripcionId = req.subscription.id;
      const plan = req.subscription.plan;

      // Obtener uso actual de recursos
      const recursos = await prisma.recursos.findFirst({
        where: {
          id_suscripcion: suscripcionId
        }
      });

      if (!recursos) {
        return res.status(500).json({
          success: false,
          message: 'Error al obtener recursos'
        });
      }

      // Verificar según el tipo de recurso
      switch (resourceType) {
        case 'whatsapp':
          const whatsappUsage = recursos.whatsapp_usado;
          const whatsappLimit = plan.limites_whatsapp;
          
          if (whatsappUsage >= whatsappLimit) {
            return res.status(403).json({
              success: false,
              message: `Has alcanzado el límite de WhatsApp para tu plan (${whatsappLimit})`,
              currentUsage: whatsappUsage,
              limit: whatsappLimit,
              resourceType: 'whatsapp'
            });
          }
          
          req.resourceUsage = {
            whatsapp: {
              current: whatsappUsage,
              limit: whatsappLimit,
              remaining: whatsappLimit - whatsappUsage
            }
          };
          break;

        case 'email':
          const emailUsage = recursos.email_usado;
          const emailLimit = plan.limites_email;
          
          if (emailUsage >= emailLimit) {
            return res.status(403).json({
              success: false,
              message: `Has alcanzado el límite de emails para tu plan (${emailLimit})`,
              currentUsage: emailUsage,
              limit: emailLimit,
              resourceType: 'email'
            });
          }
          
          req.resourceUsage = {
            email: {
              current: emailUsage,
              limit: emailLimit,
              remaining: emailLimit - emailUsage
            }
          };
          break;

        case 'api':
          // Para API solo verificar si tiene acceso (boolean)
          if (!plan.limites_api) {
            return res.status(403).json({
              success: false,
              message: 'Tu plan no incluye acceso a la API',
              resourceType: 'api'
            });
          }
          
          // Si tiene acceso, no hay límite numérico
          req.resourceUsage = {
            api: {
              current: recursos.llamadas_api_usado,
              limit: -1, // -1 indica ilimitado
              remaining: -1
            }
          };
          break;

        case 'clientes':
          const clientesUsage = recursos.clientes_usado;
          const clientesLimit = plan.limites_clientes ?? 0;
          
          if (clientesUsage >= clientesLimit) {
            return res.status(403).json({
              success: false,
              message: `Has alcanzado el límite de clientes para tu plan (${clientesLimit})`,
              currentUsage: clientesUsage,
              limit: clientesLimit,
              resourceType: 'clientes'
            });
          }
          
          req.resourceUsage = {
            clientes: {
              current: clientesUsage,
              limit: clientesLimit,
              remaining: clientesLimit - clientesUsage
            }
          };
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Tipo de recurso inválido'
          });
      }

      next();
    } catch (error) {
      console.error('Error en middleware de límite de recursos:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Función auxiliar para incrementar uso de recursos
export const incrementResourceUsage = async (
  suscripcionId: string,
  resourceType: ResourceType
): Promise<boolean> => {
  try {
    const updateField = (() => {
      switch (resourceType) {
        case 'whatsapp': return { whatsapp_usado: { increment: 1 } };
        case 'email': return { email_usado: { increment: 1 } };
        case 'api': return { llamadas_api_usado: { increment: 1 } };
        case 'clientes': return { clientes_usado: { increment: 1 } };
        default: throw new Error('Tipo de recurso inválido');
      }
    })();

    await prisma.recursos.updateMany({
      where: { id_suscripcion: suscripcionId },
      data: {
        ...updateField,
        fecha_actualizacion: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Error al incrementar uso de recursos:', error);
    return false;
  }
};