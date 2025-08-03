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
        success_url: `${process.env.FRONTEND_URL}/suscripcion/exito?session_id={CHECKOUT_SESSION_ID}`,
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
          custom_id: `${inquilinoId}|${planId}|paypal` // ✅ Aquí está el custom_id
        }],
        application_context: {
          return_url: `${process.env.FRONTEND_URL}/suscripcion/exito`,
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
        creado_en: 'desc' // La más reciente
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
      mensaje = 'Tu suscripción ha sido cancelada';
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
    const recursos = suscripcion.Recursos[0]; // Debería haber solo uno por suscripción
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

    let cancelacionExitosa = false;
    let errorPasarela = null;

    try {
      // Cancelar en la pasarela correspondiente
      if (suscripcion.pasarela_pago === 'stripe') {
        // Cancelar suscripción en Stripe
        await stripe.subscriptions.cancel(suscripcion.id_suscripcion_externa, {
          prorate: false
        });
        cancelacionExitosa = true;

      } else if (suscripcion.pasarela_pago === 'paypal') {
        // Obtener token de acceso para PayPal
        const authResponse = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString('base64')}`
          },
          body: 'grant_type=client_credentials'
        });

        const authData = await authResponse.json() as PayPalAuthResponse;
        
        // Cancelar suscripción
        const cancelUrl = `https://api.sandbox.paypal.com/v1/billing/subscriptions/${suscripcion.id_suscripcion_externa}/cancel`;
        const cancelResponse = await fetch(cancelUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.access_token}`
          },
          body: JSON.stringify({
            reason: 'Cancelada por el usuario'
          })
        });

        if (cancelResponse.ok) {
          cancelacionExitosa = true;
        } else {
          throw new Error(`PayPal cancel failed: ${cancelResponse.status}`);
        }

      } else {
        throw new Error('Pasarela no reconocida');
      }

    } catch (pasarelaError) {
      console.error('Error al cancelar en la pasarela:', pasarelaError);
      errorPasarela = pasarelaError;
    }

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
        accesoDias: diasRestantes,
        mensajeAcceso: diasRestantes > 0 
          ? `Mantienes acceso por ${diasRestantes} días más (período ya pagado)`
          : 'Tu acceso finaliza hoy',
        plan: {
          nombre: suscripcionActualizada.Planes.nombre_plan,
          precio: suscripcionActualizada.Planes.precio_plan
        }
      },
      warnings: !cancelacionExitosa && errorPasarela ? [
        'La cancelación local fue exitosa, pero hubo un problema con la pasarela. El estado se sincronizará automáticamente.'
      ] : []
    });

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

    let cambioExitoso = false;
    let errorPasarela = null;

    try {
      if (gateway === 'stripe') {
        // Obtener la suscripción actual de Stripe
        const subscription = await stripe.subscriptions.retrieve(suscripcionActual.id_suscripcion_externa);
        
        // Cambiar el plan en Stripe
        await stripe.subscriptions.update(suscripcionActual.id_suscripcion_externa, {
          items: [{
            id: subscription.items.data[0].id,
            price: planNuevo.stripe_price_id!,
          }],
          proration_behavior: 'create_prorations', // Prorratear el cambio
          metadata: {
            inquilino_id: inquilinoId,
            plan_id: planId,
            cambio_realizado: new Date().toISOString()
          }
        });

        cambioExitoso = true;

      } else if (gateway === 'paypal') {
        // Para PayPal, necesitamos cancelar la actual y crear una nueva
        // Esto es más complejo, por simplicidad programaremos el cambio para la próxima renovación
        
        // Actualizar el plan siguiente en nuestra BD
        await prisma.suscripciones.update({
          where: {
            id_suscripcion: suscripcionActual.id_suscripcion
          },
          data: {
            id_plan_siguiente: planId,
            actualizado_en: new Date()
          }
        });

        return res.json({
          success: true,
          message: 'Cambio de plan programado',
          details: {
            planActual: suscripcionActual.Planes.nombre_plan,
            planNuevo: planNuevo.nombre_plan,
            fechaCambio: suscripcionActual.fecha_renovacion,
            mensaje: 'El cambio de plan se aplicará en tu próxima renovación'
          }
        });
      }

    } catch (pasarelaError) {
      console.error('Error al cambiar plan en la pasarela:', pasarelaError);
      errorPasarela = pasarelaError;
    }

    if (cambioExitoso) {
      // Para Stripe, actualizar inmediatamente
      const suscripcionActualizada = await prisma.suscripciones.update({
        where: {
          id_suscripcion: suscripcionActual.id_suscripcion
        },
        data: {
          id_plan: planId,
          actualizado_en: new Date()
        },
        include: {
          Planes: true
        }
      });

      // Resetear contadores de recursos para el nuevo plan
      await prisma.recursos.updateMany({
        where: {
          id_suscripcion: suscripcionActual.id_suscripcion
        },
        data: {
          whatsapp_usado: 0,
          email_usado: 0,
          clientes_usado: 0,
          llamadas_api_usado: 0,
          fecha_actualizacion: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'Plan cambiado exitosamente',
        subscription: {
          id: suscripcionActualizada.id_suscripcion,
          planAnterior: suscripcionActual.Planes.nombre_plan,
          planNuevo: suscripcionActualizada.Planes.nombre_plan,
          precioAnterior: suscripcionActual.Planes.precio_plan,
          precioNuevo: suscripcionActualizada.Planes.precio_plan,
          recursosReseteados: true,
          mensaje: 'Tu plan ha sido actualizado y los contadores de recursos han sido reiniciados'
        }
      });

    } else {
      return res.status(500).json({
        success: false,
        message: 'Error al cambiar plan en la pasarela',
        error: errorPasarela
      });
    }

  } catch (error) {
    console.error('Error al cambiar plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

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
          in: ['activa', 'pago_vencido']
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

    const recursos = suscripcion.Recursos[0]; // Debería haber solo uno
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

    // Función para obtener color del estado
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'agotado': return '#ff4444';
        case 'critico': return '#ff8800';
        case 'advertencia': return '#ffaa00';
        default: return '#44bb44';
      }
    };

    const resourcesData = {
      whatsapp: {
        usado: recursos.whatsapp_usado,
        limite: plan.limites_whatsapp,
        restante: Math.max(0, plan.limites_whatsapp - recursos.whatsapp_usado),
        porcentaje: whatsappPorcentaje,
        status: getResourceStatus(whatsappPorcentaje),
        color: getStatusColor(getResourceStatus(whatsappPorcentaje)),
        descripcion: 'Mensajes de WhatsApp enviados'
      },
      email: {
        usado: recursos.email_usado,
        limite: plan.limites_email,
        restante: Math.max(0, plan.limites_email - recursos.email_usado),
        porcentaje: emailPorcentaje,
        status: getResourceStatus(emailPorcentaje),
        color: getStatusColor(getResourceStatus(emailPorcentaje)),
        descripcion: 'Emails de recordatorio enviados'
      },
      clientes: {
        usado: recursos.clientes_usado,
        limite: plan.limites_clientes || 0,
        restante: Math.max(0, (plan.limites_clientes || 0) - recursos.clientes_usado),
        porcentaje: clientesPorcentaje,
        status: getResourceStatus(clientesPorcentaje),
        color: getStatusColor(getResourceStatus(clientesPorcentaje)),
        descripcion: 'Clientes registrados en tu sistema'
      },
      api: {
        usado: recursos.llamadas_api_usado,
        acceso: plan.limites_api,
        limite: plan.limites_api ? 'Ilimitado' : 'Sin acceso',
        status: plan.limites_api ? 'disponible' : 'bloqueado',
        color: plan.limites_api ? '#44bb44' : '#ff4444',
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

