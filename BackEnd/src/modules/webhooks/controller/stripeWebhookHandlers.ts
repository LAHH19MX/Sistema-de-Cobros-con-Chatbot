import { prisma } from '../../../db/client';
import Stripe from 'stripe';

export const handleStripeSubscriptionCreated = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log('Processing Stripe subscription created:', subscription.id);
    
    // Obtener metadata que enviamos desde el checkout
    const inquilinoId = subscription.metadata.inquilino_id;
    const planId = subscription.metadata.plan_id;
    
    if (!inquilinoId || !planId) {
      console.error('Missing metadata in subscription:', subscription.id);
      return;
    }

    // Verificar que el inquilino existe
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino: inquilinoId }
    });

    if (!inquilino) {
      console.error('Inquilino not found:', inquilinoId);
      return;
    }

    // Verificar que el plan existe
    const plan = await prisma.planes.findUnique({
      where: { id_plan: planId }
    });

    if (!plan) {
      console.error('Plan not found:', planId);
      return;
    }

    // Calcular fecha de renovación (1 mes desde ahora)
    const fechaRenovacion = new Date();
    fechaRenovacion.setMonth(fechaRenovacion.getMonth() + 1);

    // Crear suscripción en nuestra BD
    const nuevaSuscripcion = await prisma.suscripciones.create({
      data: {
        estado_suscripcion: 'activa',
        fecha_inicio: new Date(),
        fecha_renovacion: fechaRenovacion,
        id_suscripcion_externa: subscription.id,
        id_cliente_externo: subscription.customer as string,
        id_inquilino: inquilinoId,
        id_plan: planId,
        pasarela_pago: 'stripe',
        creado_en: new Date(),
        actualizado_en: new Date()
      }
    });

    // Crear registro de recursos inicializado en 0
    await prisma.recursos.create({
      data: {
        id_suscripcion: nuevaSuscripcion.id_suscripcion,
        whatsapp_usado: 0,
        email_usado: 0,
        clientes_usado: 0,
        llamadas_api_usado: 0,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      }
    });

    console.log('Stripe subscription created successfully:', nuevaSuscripcion.id_suscripcion);
    
  } catch (error) {
    console.error('Error handling Stripe subscription created:', error);
  }
};

export const handleStripeSubscriptionUpdated = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log('Processing Stripe subscription updated:', subscription.id);
    
    // Buscar suscripción en nuestra BD
    const suscripcionExistente = await prisma.suscripciones.findFirst({
      where: {
        id_suscripcion_externa: subscription.id,
        pasarela_pago: 'stripe'
      }
    });

    if (!suscripcionExistente) {
      console.error('Subscription not found in DB:', subscription.id);
      return;
    }

    // Determinar nuevo estado basado en el status de Stripe
    let nuevoEstado: string;
    switch (subscription.status) {
      case 'active':
        nuevoEstado = 'activa';
        break;
      case 'past_due':
        nuevoEstado = 'pago_vencido';
        break;
      case 'canceled':
        nuevoEstado = 'cancelada';
        break;
      case 'incomplete':
        nuevoEstado = 'incompleta';
        break;
      default:
        nuevoEstado = subscription.status;
    }

    // Actualizar suscripción
    await prisma.suscripciones.update({
      where: {
        id_suscripcion: suscripcionExistente.id_suscripcion
      },
      data: {
        estado_suscripcion: nuevoEstado,
        actualizado_en: new Date(),
        ...(nuevoEstado === 'cancelada' && !suscripcionExistente.fecha_cancelacion 
          ? { fecha_cancelacion: new Date() } 
          : {})
      }
    });

    console.log('Stripe subscription updated successfully:', suscripcionExistente.id_suscripcion);
    
  } catch (error) {
    console.error('Error handling Stripe subscription updated:', error);
  }
};

export const handleStripeSubscriptionDeleted = async (event: Stripe.Event) => {
  try {
    const subscription = event.data.object as Stripe.Subscription;
    
    console.log('Processing Stripe subscription deleted:', subscription.id);
    
    // Buscar y actualizar suscripción
    const suscripcionActualizada = await prisma.suscripciones.updateMany({
      where: {
        id_suscripcion_externa: subscription.id,
        pasarela_pago: 'stripe'
      },
      data: {
        estado_suscripcion: 'cancelada',
        fecha_cancelacion: new Date(),
        actualizado_en: new Date()
      }
    });

    if (suscripcionActualizada.count === 0) {
      console.error('Subscription not found in DB for deletion:', subscription.id);
      return;
    }

    console.log('Stripe subscription deleted successfully');
    
  } catch (error) {
    console.error('Error handling Stripe subscription deleted:', error);
  }
};

export const handleStripePaymentSucceeded = async (event: Stripe.Event) => {
  try {
    const invoice = event.data.object as any; // Cast a any para acceder a subscription
    
    console.log('Processing Stripe payment succeeded:', invoice.id);
    
    // Solo procesar si es una factura de suscripción
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return;
    }

    // Buscar suscripción
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_suscripcion_externa: invoice.subscription as string,
        pasarela_pago: 'stripe'
      }
    });

    if (!suscripcion) {
      console.error('Subscription not found for payment:', invoice.subscription);
      return;
    }

    // Si es una renovación (no el primer pago)
    const now = new Date();
    const nuevaFechaRenovacion = new Date(now);
    nuevaFechaRenovacion.setMonth(nuevaFechaRenovacion.getMonth() + 1);

    // Actualizar suscripción
    await prisma.suscripciones.update({
      where: {
        id_suscripcion: suscripcion.id_suscripcion
      },
      data: {
        estado_suscripcion: 'activa',
        fecha_inicio: now,
        fecha_renovacion: nuevaFechaRenovacion,
        actualizado_en: now,
        // Si había un plan siguiente programado, aplicarlo
        ...(suscripcion.id_plan_siguiente ? {
          id_plan: suscripcion.id_plan_siguiente,
          id_plan_siguiente: null
        } : {})
      }
    });

    // Resetear contadores de recursos para el nuevo período
    await prisma.recursos.updateMany({
      where: {
        id_suscripcion: suscripcion.id_suscripcion
      },
      data: {
        whatsapp_usado: 0,
        email_usado: 0,
        clientes_usado: 0,
        llamadas_api_usado: 0,
        fecha_actualizacion: now
      }
    });

    console.log('Stripe payment succeeded processed successfully');
    
  } catch (error) {
    console.error('Error handling Stripe payment succeeded:', error);
  }
};


export const handleStripePaymentFailed = async (event: Stripe.Event) => {
  try {
    const invoice = event.data.object as any; // Cast a any para acceder a subscription
    
    console.log('Processing Stripe payment failed:', invoice.id);
    
    // Solo procesar si es una factura de suscripción
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return;
    }

    // Buscar y actualizar suscripción a estado de pago vencido
    const suscripcionActualizada = await prisma.suscripciones.updateMany({
      where: {
        id_suscripcion_externa: invoice.subscription as string,
        pasarela_pago: 'stripe'
      },
      data: {
        estado_suscripcion: 'pago_vencido',
        actualizado_en: new Date()
      }
    });

    if (suscripcionActualizada.count === 0) {
      console.error('Subscription not found for failed payment:', invoice.subscription);
      return;
    }

    console.log('Stripe payment failed processed successfully');
    
  } catch (error) {
    console.error('Error handling Stripe payment failed:', error);
  }
};