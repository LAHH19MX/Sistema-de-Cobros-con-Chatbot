import { prisma } from '../../../db/client';

export const handlePayPalSubscriptionCreated = async (event: any) => {
  try {
    const subscription = event.resource;
    
    console.log('Processing PayPal subscription created:', subscription.id);
    
    // Buscar custom_id en diferentes ubicaciones posibles
    let customId = null;
    
    // En el recurso directo
    if (subscription.custom_id) {
      customId = subscription.custom_id;
    }
    // En purchase_units (para ordenes de pago único)
    else if (subscription.purchase_units && subscription.purchase_units[0]?.custom_id) {
      customId = subscription.purchase_units[0].custom_id;
    }
    // En plan.custom_id
    else if (subscription.plan?.custom_id) {
      customId = subscription.plan.custom_id;
    }

    if (!customId) {
      console.error('No custom_id found in PayPal subscription:', JSON.stringify(subscription, null, 2));
      return;
    }

    // Parsear custom_id
    const parts = customId.split('|');
    if (parts.length !== 3 || parts[2] !== 'paypal') {
      console.error('Invalid custom_id format:', customId);
      return;
    }

    const inquilinoId = parts[0];
    const planId = parts[1];

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
        id_cliente_externo: subscription.subscriber?.payer_id || 'unknown',
        id_inquilino: inquilinoId,
        id_plan: planId,
        pasarela_pago: 'paypal',
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

    console.log('PayPal subscription created successfully:', nuevaSuscripcion.id_suscripcion);
    
  } catch (error) {
    console.error('Error handling PayPal subscription created:', error);
  }
};

export const handlePayPalSubscriptionActivated = async (event: any) => {
  try {
    const subscription = event.resource;
    
    console.log('Processing PayPal subscription activated:', subscription.id);
    
    // Buscar suscripción en nuestra BD
    const suscripcionExistente = await prisma.suscripciones.findFirst({
      where: {
        id_suscripcion_externa: subscription.id,
        pasarela_pago: 'paypal'
      }
    });

    if (!suscripcionExistente) {
      console.error('PayPal subscription not found in DB:', subscription.id);
      return;
    }

    // Activar suscripción
    await prisma.suscripciones.update({
      where: {
        id_suscripcion: suscripcionExistente.id_suscripcion
      },
      data: {
        estado_suscripcion: 'activa',
        actualizado_en: new Date()
      }
    });

    console.log('PayPal subscription activated successfully');
    
  } catch (error) {
    console.error('Error handling PayPal subscription activated:', error);
  }
};

export const handlePayPalSubscriptionCancelled = async (event: any) => {
  try {
    const subscription = event.resource;
    
    console.log('Processing PayPal subscription cancelled:', subscription.id);
    
    // Buscar y cancelar suscripción
    const suscripcionActualizada = await prisma.suscripciones.updateMany({
      where: {
        id_suscripcion_externa: subscription.id,
        pasarela_pago: 'paypal'
      },
      data: {
        estado_suscripcion: 'cancelada',
        fecha_cancelacion: new Date(),
        actualizado_en: new Date()
      }
    });

    if (suscripcionActualizada.count === 0) {
      console.error('PayPal subscription not found in DB for cancellation:', subscription.id);
      return;
    }

    console.log('PayPal subscription cancelled successfully');
    
  } catch (error) {
    console.error('Error handling PayPal subscription cancelled:', error);
  }
};

export const handlePayPalPaymentCompleted = async (event: any) => {
  try {
    const payment = event.resource;
    
    console.log('Processing PayPal payment completed:', payment.id);
    
    // PayPal estructura es diferente, necesitamos buscar por billing_agreement_id o parent_payment
    const subscriptionId = payment.billing_agreement_id || payment.parent_payment;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in PayPal payment, skipping');
      return;
    }

    // Buscar suscripción
    const suscripcion = await prisma.suscripciones.findFirst({
      where: {
        id_suscripcion_externa: subscriptionId,
        pasarela_pago: 'paypal'
      }
    });

    if (!suscripcion) {
      console.error('PayPal subscription not found for payment:', subscriptionId);
      return;
    }

    // Renovar suscripción
    const now = new Date();
    const nuevaFechaRenovacion = new Date(now);
    nuevaFechaRenovacion.setMonth(nuevaFechaRenovacion.getMonth() + 1);

    await prisma.suscripciones.update({
      where: {
        id_suscripcion: suscripcion.id_suscripcion
      },
      data: {
        estado_suscripcion: 'activa',
        fecha_inicio: now,
        fecha_renovacion: nuevaFechaRenovacion,
        actualizado_en: now,
        ...(suscripcion.id_plan_siguiente ? {
          id_plan: suscripcion.id_plan_siguiente,
          id_plan_siguiente: null
        } : {})
      }
    });

    // Resetear recursos
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

    console.log('PayPal payment completed processed successfully');
    
  } catch (error) {
    console.error('Error handling PayPal payment completed:', error);
  }
};

export const handlePayPalPaymentDenied = async (event: any) => {
  try {
    const payment = event.resource;
    
    console.log('Processing PayPal payment denied:', payment.id);
    
    // Buscar suscripción relacionada
    const subscriptionId = payment.billing_agreement_id || payment.parent_payment;
    
    if (!subscriptionId) {
      console.log('No subscription ID found in PayPal payment denial, skipping');
      return;
    }

    // Marcar como pago vencido
    const suscripcionActualizada = await prisma.suscripciones.updateMany({
      where: {
        id_suscripcion_externa: subscriptionId,
        pasarela_pago: 'paypal'
      },
      data: {
        estado_suscripcion: 'pago_vencido',
        actualizado_en: new Date()
      }
    });

    if (suscripcionActualizada.count === 0) {
      console.error('PayPal subscription not found for payment denial:', subscriptionId);
      return;
    }

    console.log('PayPal payment denied processed successfully');
    
  } catch (error) {
    console.error('Error handling PayPal payment denied:', error);
  }
};