import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import { stripe } from '../../../common/config/stripe';
import { paypalClient } from '../../../common/config/paypal';
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    rol: string;
    nombre: string;
  };
}

export const createCheckout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId, gateway } = req.body;
    
    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo inquilinos pueden suscribirse
    if (req.user.rol !== 'inquilino') {
      return res.status(403).json({
        success: false,
        message: 'Solo inquilinos pueden suscribirse'
      });
    }

    const inquilinoId = req.user.id;

    // Verificar que no tenga suscripción activa
    const suscripcionExistente = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: {
          in: ['activa', 'pago_vencido']
        }
      }
    });

    if (suscripcionExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una suscripción activa'
      });
    }

    // Buscar el plan
    const plan = await prisma.planes.findUnique({
      where: { id_plan: planId }
    });

    if (!plan || !plan.estado_plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado o inactivo'
      });
    }

    // Verificar que el plan tenga ID para la pasarela seleccionada
    if (gateway === 'stripe' && !plan.stripe_price_id) {
      return res.status(400).json({
        success: false,
        message: 'Este plan no está disponible en Stripe'
      });
    }

    if (gateway === 'paypal' && !plan.paypal_plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Este plan no está disponible en PayPal'
      });
    }

    // Buscar datos del inquilino
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino: inquilinoId }
    });

    if (!inquilino) {
      return res.status(404).json({
        success: false,
        message: 'Inquilino no encontrado'
      });
    }

    let checkoutUrl: string;

    if (gateway === 'stripe') {
      // Crear sesión de checkout en Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripe_price_id!,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/tenant/suscripcion/exito?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/suscripcion/cancelar`,
        customer_email: inquilino.email_inquilino,
        metadata: {
          inquilino_id: inquilinoId,
          plan_id: planId,
          gateway: 'stripe'
        },
        subscription_data: {
          metadata: {
            inquilino_id: inquilinoId,
            plan_id: planId
          }
        }
      });

      checkoutUrl = session.url!;

    } else if (gateway === 'paypal') {
      // Crear suscripción en PayPal
      const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: plan.precio_plan.toString()
          },
          description: `Suscripción mensual: ${plan.nombre_plan}`,
          custom_id: `${inquilinoId}|${planId}|paypal`
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/tenant/suscripcion/exito`,
          cancel_url: `${process.env.FRONTEND_URL}/suscripcion/cancelar`,
          brand_name: 'Sistema de Cobros',
          user_action: 'PAY_NOW'
        }
      });

      const order = await paypalClient.execute(request);
      
      // Encontrar el link de aprobación
      const approvalLink = order.result.links?.find(
        (link: any) => link.rel === 'approve'
      );

      if (!approvalLink) {
        throw new Error('No se pudo generar el link de PayPal');
      }

      checkoutUrl = approvalLink.href;

    } else {
      return res.status(400).json({
        success: false,
        message: 'Pasarela no válida'
      });
    }

    return res.json({
      success: true,
      checkoutUrl,
      plan: {
        id: plan.id_plan,
        nombre: plan.nombre_plan,
        precio: plan.precio_plan
      }
    });

  } catch (error) {
    console.error('Error al crear checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

export const getSubscriptionStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo inquilinos pueden consultar suscripción
    if (req.user.rol !== 'inquilino') {
      return res.status(403).json({
        success: false,
        message: 'Solo inquilinos pueden consultar suscripciones'
      });
    }

    const inquilinoId = req.user.id;

    // Buscar suscripción del inquilino
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId
      },
      include: {
        Planes: true,
        Recursos: true
      },
      orderBy: {
        creado_en: 'desc'
      }
    });

    // Si no tiene suscripción
    if (!suscripcion) {
      return res.json({
        success: true,
        hasSubscription: false,
        message: 'No tienes ninguna suscripción'
      });
    }

    // Calcular días restantes hasta renovación
    const now = new Date();
    const fechaRenovacion = new Date(suscripcion.fecha_renovacion);
    const diasRestantes = Math.ceil((fechaRenovacion.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    
    // Verificar período de gracia (3 días)
    const diasGracia = 3;
    const fechaLimite = new Date(fechaRenovacion.getTime() + (diasGracia * 24 * 60 * 60 * 1000));
    const enPeriodoGracia = now > fechaRenovacion && now <= fechaLimite;
    const suscripcionVencida = now > fechaLimite;

    // Determinar estado de la suscripción
    let estadoReal: string;
    let mensaje: string = '';
    
    if (suscripcion.estado_suscripcion === 'cancelada') {
      estadoReal = 'cancelada';
      if (diasRestantes > 0) {
        mensaje = `Tu suscripción está cancelada. Mantienes acceso por ${diasRestantes} días más.`;
      } else {
        mensaje = 'Tu suscripción ha sido cancelada y el acceso ha expirado.';
      }
    } else if (suscripcionVencida && suscripcion.estado_suscripcion === 'pago_vencido') {
      estadoReal = 'vencida';
      mensaje = 'Tu suscripción ha vencido. Renueva tu pago para continuar.';
    } else if (enPeriodoGracia && suscripcion.estado_suscripcion === 'pago_vencido') {
      estadoReal = 'periodo_gracia';
      const diasRestantesGracia = Math.ceil((fechaLimite.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      mensaje = `Tu suscripción vence en ${diasRestantesGracia} días. Actualiza tu método de pago.`;
    } else if (suscripcion.estado_suscripcion === 'activa') {
      estadoReal = 'activa';
      mensaje = diasRestantes > 0 
        ? `Tu suscripción se renueva en ${diasRestantes} días`
        : 'Tu suscripción se renueva hoy';
    } else {
      estadoReal = suscripcion.estado_suscripcion;
      mensaje = 'Estado de suscripción: ' + suscripcion.estado_suscripcion;
    }

    // Calcular uso de recursos
    const recursos = suscripcion.Recursos[0]; 
    const plan = suscripcion.Planes;

    const usoRecursos = recursos ? {
      whatsapp: {
        usado: recursos.whatsapp_usado,
        limite: plan.limites_whatsapp,
        porcentaje: Math.round((recursos.whatsapp_usado / plan.limites_whatsapp) * 100)
      },
      email: {
        usado: recursos.email_usado,
        limite: plan.limites_email,
        porcentaje: Math.round((recursos.email_usado / plan.limites_email) * 100)
      },
      clientes: {
        usado: recursos.clientes_usado,
        limite: plan.limites_clientes || 0,
        porcentaje: plan.limites_clientes ? Math.round((recursos.clientes_usado / plan.limites_clientes) * 100) : 0
      },
      api: {
        usado: recursos.llamadas_api_usado,
        acceso: plan.limites_api,
        mensaje: plan.limites_api ? 'Acceso disponible' : 'Sin acceso'
      }
    } : null;

    // Informacion del plan siguiente
    let planSiguiente = null;
    if (suscripcion.id_plan_siguiente) {
      const planSig = await prisma.planes.findUnique({
        where: { id_plan: suscripcion.id_plan_siguiente }
      });
      
      if (planSig) {
        planSiguiente = {
          id: planSig.id_plan,
          nombre: planSig.nombre_plan,
          precio: planSig.precio_plan,
          fechaCambio: suscripcion.fecha_renovacion,
          mensaje: `Cambiarás a "${planSig.nombre_plan}" el ${fechaRenovacion.toLocaleDateString('es-ES')}`
        };
      }
    }

    return res.json({
      success: true,
      hasSubscription: true,
      subscription: {
        id: suscripcion.id_suscripcion,
        estado: estadoReal,
        mensaje,
        fechaInicio: suscripcion.fecha_inicio,
        fechaRenovacion: suscripcion.fecha_renovacion,
        fechaCancelacion: suscripcion.fecha_cancelacion,
        pasarela: suscripcion.pasarela_pago,
        diasRestantes,
        enPeriodoGracia,
        plan: {
          id: plan.id_plan,
          nombre: plan.nombre_plan,
          descripcion: plan.descripcion_plan,
          precio: plan.precio_plan,
          limites: {
            whatsapp: plan.limites_whatsapp,
            email: plan.limites_email,
            clientes: plan.limites_clientes,
            api: plan.limites_api
          }
        },
        planSiguiente,
        recursos: usoRecursos
      }
    });

  } catch (error) {
    console.error('Error al obtener estado de suscripción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Agregar interface para PayPal auth
interface PayPalAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export const cancelSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo inquilinos pueden cancelar suscripción
    if (req.user.rol !== 'inquilino') {
      return res.status(403).json({
        success: false,
        message: 'Solo inquilinos pueden cancelar suscripciones'
      });
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
        Planes: true
      }
    });

    // Si no tiene suscripción activa
    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una suscripción activa para cancelar'
      });
    }

    // No permitir cancelar si ya está cancelada
    if (suscripcion.estado_suscripcion === 'cancelada') {
      return res.status(400).json({
        success: false,
        message: 'La suscripción ya está cancelada'
      });
    }

    try {
      // Actualizar estado en la base de datos
      const suscripcionActualizada = await prisma.suscripciones.update({
        where: {
          id_suscripcion: suscripcion.id_suscripcion
        },
        data: {
          estado_suscripcion: 'cancelada',
          fecha_cancelacion: new Date(),
          actualizado_en: new Date()
        },
        include: {
          Planes: true
        }
      });

      // Calcular días restantes del período ya pagado
      const now = new Date();
      const fechaRenovacion = new Date(suscripcion.fecha_renovacion);
      const diasRestantes = Math.max(0, Math.ceil((fechaRenovacion.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

      return res.json({
        success: true,
        message: 'Suscripción cancelada exitosamente',
        subscription: {
          id: suscripcionActualizada.id_suscripcion,
          estado: 'cancelada',
          fechaCancelacion: suscripcionActualizada.fecha_cancelacion,
          fechaFinAcceso: suscripcion.fecha_renovacion,
          accesoDias: diasRestantes,
          mensajeAcceso: diasRestantes > 0 
            ? `Mantienes acceso por ${diasRestantes} días más hasta el ${fechaRenovacion.toLocaleDateString('es-ES')}`
            : 'Tu acceso finaliza hoy',
          plan: {
            nombre: suscripcionActualizada.Planes.nombre_plan,
            precio: suscripcionActualizada.Planes.precio_plan
          }
        }
      });

    } catch (error) {
      console.error('Error al cancelar suscripción:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al cancelar la suscripción'
      });
    }

  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


export const changePlan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId, gateway } = req.body;

    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo inquilinos pueden cambiar plan
    if (req.user.rol !== 'inquilino') {
      return res.status(403).json({
        success: false,
        message: 'Solo inquilinos pueden cambiar de plan'
      });
    }

    const inquilinoId = req.user.id;

    // Buscar suscripción activa
    const suscripcionActual = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: 'activa'
      },
      include: {
        Planes: true
      }
    });

    if (!suscripcionActual) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una suscripción activa para cambiar'
      });
    }

    // Buscar el plan nuevo
    const planNuevo = await prisma.planes.findUnique({
      where: { id_plan: planId }
    });

    if (!planNuevo || !planNuevo.estado_plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado o inactivo'
      });
    }

    // Verificar que no sea el mismo plan
    if (suscripcionActual.id_plan === planId) {
      return res.status(400).json({
        success: false,
        message: 'Ya tienes este plan activo'
      });
    }

    // Verificar que el plan nuevo tenga ID para la pasarela
    if (gateway === 'stripe' && !planNuevo.stripe_price_id) {
      return res.status(400).json({
        success: false,
        message: 'Este plan no está disponible en Stripe'
      });
    }

    if (gateway === 'paypal' && !planNuevo.paypal_plan_id) {
      return res.status(400).json({
        success: false,
        message: 'Este plan no está disponible en PayPal'
      });
    }

    // Verificar que la pasarela sea la misma que la suscripción actual
    if (suscripcionActual.pasarela_pago !== gateway) {
      return res.status(400).json({
        success: false,
        message: `Tu suscripción actual es con ${suscripcionActual.pasarela_pago}. No puedes cambiar a ${gateway}.`
      });
    }

    // ✅ NUEVO ENFOQUE: SIEMPRE PROGRAMAR CAMBIO (STRIPE Y PAYPAL)
    try {
      // Actualizar el plan siguiente en nuestra BD (TANTO STRIPE COMO PAYPAL)
      const suscripcionActualizada = await prisma.suscripciones.update({
        where: {
          id_suscripcion: suscripcionActual.id_suscripcion
        },
        data: {
          id_plan_siguiente: planId,
          actualizado_en: new Date()
        },
        include: {
          Planes: true
        }
      });

      return res.json({
        success: true,
        message: 'Cambio de plan programado exitosamente',
        subscription: {
          id: suscripcionActualizada.id_suscripcion,
          planActual: suscripcionActual.Planes.nombre_plan,
          planNuevo: planNuevo.nombre_plan,
          precioActual: suscripcionActual.Planes.precio_plan,
          precioNuevo: planNuevo.precio_plan,
          fechaCambio: suscripcionActual.fecha_renovacion,
          mensaje: `El cambio a "${planNuevo.nombre_plan}" se aplicará en tu próxima renovación (${new Date(suscripcionActual.fecha_renovacion).toLocaleDateString('es-ES')})`
        }
      });

    } catch (error) {
      console.error('Error al programar cambio de plan:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al programar el cambio de plan'
      });
    }

  } catch (error) {
    console.error('Error al cambiar plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

export const getResourceUsage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Solo inquilinos pueden consultar recursos
    if (req.user.rol !== 'inquilino') {
      return res.status(403).json({
        success: false,
        message: 'Solo inquilinos pueden consultar uso de recursos'
      });
    }

    const inquilinoId = req.user.id;

    // Buscar suscripción activa
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_inquilino: inquilinoId,
        estado_suscripcion: {
          in: ['activa', 'pago_vencido','cancelada']
        }
      },
      include: {
        Planes: true,
        Recursos: true
      }
    });

    if (!suscripcion) {
      return res.status(404).json({
        success: false,
        message: 'No tienes una suscripción activa'
      });
    }

    const recursos = suscripcion.Recursos[0]; 
    const plan = suscripcion.Planes;

    if (!recursos) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron datos de recursos'
      });
    }

    // Calcular días restantes hasta renovación (reset de contadores)
    const now = new Date();
    const fechaRenovacion = new Date(suscripcion.fecha_renovacion);
    const diasHastaReset = Math.max(0, Math.ceil((fechaRenovacion.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));

    // Calcular porcentajes y estados
    const whatsappPorcentaje = Math.round((recursos.whatsapp_usado / plan.limites_whatsapp) * 100);
    const emailPorcentaje = Math.round((recursos.email_usado / plan.limites_email) * 100);
    const clientesPorcentaje = plan.limites_clientes 
      ? Math.round((recursos.clientes_usado / plan.limites_clientes) * 100) 
      : 0;

    // Función para determinar estado del recurso
    const getResourceStatus = (porcentaje: number) => {
      if (porcentaje >= 100) return 'agotado';
      if (porcentaje >= 80) return 'critico';
      if (porcentaje >= 60) return 'advertencia';
      return 'normal';
    };

    const resourcesData = {
      whatsapp: {
        usado: recursos.whatsapp_usado,
        limite: plan.limites_whatsapp,
        restante: Math.max(0, plan.limites_whatsapp - recursos.whatsapp_usado),
        porcentaje: whatsappPorcentaje,
        status: getResourceStatus(whatsappPorcentaje),
        descripcion: 'Mensajes de WhatsApp enviados'
      },
      email: {
        usado: recursos.email_usado,
        limite: plan.limites_email,
        restante: Math.max(0, plan.limites_email - recursos.email_usado),
        porcentaje: emailPorcentaje,
        status: getResourceStatus(emailPorcentaje),
        descripcion: 'Emails de recordatorio enviados'
      },
      clientes: {
        usado: recursos.clientes_usado,
        limite: plan.limites_clientes || 0,
        restante: Math.max(0, (plan.limites_clientes || 0) - recursos.clientes_usado),
        porcentaje: clientesPorcentaje,
        status: getResourceStatus(clientesPorcentaje),
        descripcion: 'Clientes registrados en tu sistema'
      },
      api: {
        usado: recursos.llamadas_api_usado,
        acceso: plan.limites_api,
        limite: plan.limites_api ? 'Ilimitado' : 'Sin acceso',
        status: plan.limites_api ? 'disponible' : 'bloqueado',
        descripcion: 'Llamadas a la API realizadas'
      }
    };

    // Calcular resumen general
    const recursosAgotados = [
      resourcesData.whatsapp.status === 'agotado',
      resourcesData.email.status === 'agotado',
      resourcesData.clientes.status === 'agotado'
    ].filter(Boolean).length;

    const recursosCriticos = [
      resourcesData.whatsapp.status === 'critico',
      resourcesData.email.status === 'critico',
      resourcesData.clientes.status === 'critico'
    ].filter(Boolean).length;

    let estadoGeneral: string;
    let mensajeGeneral: string;

    if (recursosAgotados > 0) {
      estadoGeneral = 'critico';
      mensajeGeneral = `${recursosAgotados} recurso(s) agotado(s). Considera actualizar tu plan.`;
    } else if (recursosCriticos > 0) {
      estadoGeneral = 'advertencia';
      mensajeGeneral = `${recursosCriticos} recurso(s) cerca del límite.`;
    } else {
      estadoGeneral = 'bueno';
      mensajeGeneral = 'Uso de recursos dentro de los límites normales.';
    }

    return res.json({
      success: true,
      plan: {
        id: plan.id_plan,
        nombre: plan.nombre_plan,
        precio: plan.precio_plan
      },
      periodo: {
        fechaInicio: suscripcion.fecha_inicio,
        fechaRenovacion: suscripcion.fecha_renovacion,
        diasHastaReset: diasHastaReset,
        mensaje: diasHastaReset > 0 
          ? `Los contadores se reinician en ${diasHastaReset} días`
          : 'Los contadores se reinician hoy'
      },
      recursos: resourcesData,
      resumen: {
        estado: estadoGeneral,
        mensaje: mensajeGeneral,
        ultimaActualizacion: recursos.fecha_actualizacion || recursos.fecha_creacion,
        recursosAgotados,
        recursosCriticos
      },
      recomendaciones: [
        ...(recursosAgotados > 0 ? ['Considera actualizar a un plan superior'] : []),
        ...(recursosCriticos > 0 ? ['Monitorea el uso de recursos frecuentemente'] : []),
        ...(diasHastaReset <= 3 ? ['Los contadores se reiniciarán pronto'] : [])
      ]
    });

  } catch (error) {
    console.error('Error al obtener uso de recursos:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};