import { prisma } from '../../db/client';
import { sendEmail } from '../recordatorios/ControlEmails';

// Verificar suscripciones vencidas (periodo de gracia terminado)
export const verifyExpiredSubscriptions = async () => {
  try {
    const now = new Date();
    const diasGracia = 3;

    // Buscar suscripciones que pasaron el período de gracia
    const suscripcionesVencidas = await prisma.suscripciones.findMany({
      where: {
        estado_suscripcion: 'pago_vencido',
        fecha_renovacion: {
          lt: new Date(now.getTime() - (diasGracia * 24 * 60 * 60 * 1000))
        }
      }
    });

    if (suscripcionesVencidas.length > 0) {
      // Marcar como vencidas definitivamente
      const result = await prisma.suscripciones.updateMany({
        where: {
          id_suscripcion: {
            in: suscripcionesVencidas.map(s => s.id_suscripcion)
          }
        },
        data: {
          estado_suscripcion: 'vencida',
          actualizado_en: now
        }
      });
    }

    // Verificar suscripciones que deben renovarse hoy
    const inicioDelDia = new Date(now);
    inicioDelDia.setHours(0, 0, 0, 0);
    
    const finDelDia = new Date(now);
    finDelDia.setHours(23, 59, 59, 999);

    const suscripcionesParaRenovar = await prisma.suscripciones.findMany({
      where: {
        estado_suscripcion: 'activa',
        fecha_renovacion: {
          gte: inicioDelDia,
          lte: finDelDia
        }
      }
    });

  } catch (error) {
    console.error('Error verificando suscripciones vencidas:', error);
  }
};

// Limpiar datos antiguos (solo una vez al día)
export const cleanOldData = async () => {
  try {
    
    const tresMesesAtras = new Date();
    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
    
    // Eliminar suscripciones canceladas muy antiguas
    const suscripcionesBorradas = await prisma.suscripciones.deleteMany({
      where: {
        estado_suscripcion: 'cancelada',
        fecha_cancelacion: {
          lt: tresMesesAtras
        }
      }
    });


    // Para recursos huérfanos, necesitamos hacerlo diferente
    // Primero obtener IDs de suscripciones que existen
    const suscripcionesExistentes = await prisma.suscripciones.findMany({
      select: { id_suscripcion: true }
    });

    const idsExistentes = suscripcionesExistentes.map(s => s.id_suscripcion);

    // Eliminar recursos que no tienen suscripción válida
    const recursosHuerfanos = await prisma.recursos.deleteMany({
      where: {
        id_suscripcion: {
          notIn: idsExistentes
        }
      }
    });

    
  } catch (error) {
    console.error('Error limpiando datos antiguos:', error);
  }
};

// Función para enviar notificaciones de suscripción
export const sendSubscriptionNotifications = async () => {
  try {
    const now = new Date();
    console.log('📧 Verificando notificaciones de suscripción...');

    // 1. NOTIFICACIÓN: 2 días antes del vencimiento
    await notify2DaysBeforeExpiry(now);
    
    // 2. NOTIFICACIÓN: 1 día antes del vencimiento  
    await notify1DayBeforeExpiry(now);
    
    // 3. NOTIFICACIÓN: Día del vencimiento
    await notifyExpiryDay(now);
    
    // 4. NOTIFICACIÓN: 1 día en período de gracia
    await notifyGraceDay1(now);
    
    // 5. NOTIFICACIÓN: 2 días en período de gracia (último día)
    await notifyGraceDay2(now);
    
    console.log('✅ Verificación de notificaciones completada');
    
  } catch (error) {
    console.error('❌ Error enviando notificaciones:', error);
  }
};

// Notificación: 2 días antes del vencimiento
const notify2DaysBeforeExpiry = async (now: Date) => {
  const en2Dias = new Date(now);
  en2Dias.setDate(now.getDate() + 2);
  
  const suscripciones = await prisma.suscripciones.findMany({
    where: {
      estado_suscripcion: 'activa',
      fecha_renovacion: {
        gte: new Date(en2Dias.setHours(0, 0, 0, 0)),
        lte: new Date(en2Dias.setHours(23, 59, 59, 999))
      }
    },
    include: {
      inquilinos: true,
      Planes: true
    }
  });

  for (const suscripcion of suscripciones) {
    const titulo = '⚠️ Tu suscripción vence en 2 días';
    const mensaje = `
Hola ${suscripcion.inquilinos.nombre_inquilino},

Tu suscripción al plan "${suscripcion.Planes.nombre_plan}" vence en 2 días (${suscripcion.fecha_renovacion.toLocaleDateString()}).

Asegúrate de que tu método de pago esté actualizado para evitar interrupciones en el servicio.

Si tienes alguna pregunta, no dudes en contactarnos.

Saludos,
Equipo de Soporte
    `.trim();

    await sendEmail(
      suscripcion.inquilinos.email_inquilino,
      titulo,
      mensaje
    );
    
    console.log(`📧 Notificación 2 días enviada a: ${suscripcion.inquilinos.email_inquilino}`);
  }
};

// Notificación: 1 día antes del vencimiento
const notify1DayBeforeExpiry = async (now: Date) => {
  const manana = new Date(now);
  manana.setDate(now.getDate() + 1);
  
  const suscripciones = await prisma.suscripciones.findMany({
    where: {
      estado_suscripcion: 'activa',
      fecha_renovacion: {
        gte: new Date(manana.setHours(0, 0, 0, 0)),
        lte: new Date(manana.setHours(23, 59, 59, 999))
      }
    },
    include: {
      inquilinos: true,
      Planes: true
    }
  });

  for (const suscripcion of suscripciones) {
    const titulo = '🚨 Tu suscripción vence mañana';
    const mensaje = `
Hola ${suscripcion.inquilinos.nombre_inquilino},

Tu suscripción al plan "${suscripcion.Planes.nombre_plan}" vence mañana (${suscripcion.fecha_renovacion.toLocaleDateString()}).

¡ACCIÓN REQUERIDA! Verifica tu método de pago para evitar la interrupción del servicio.

Si no se procesa el pago, tendrás 3 días de gracia para resolver cualquier problema.

Saludos,
Equipo de Soporte
    `.trim();

    await sendEmail(
      suscripcion.inquilinos.email_inquilino,
      titulo,
      mensaje
    );
    
    console.log(`📧 Notificación 1 día enviada a: ${suscripcion.inquilinos.email_inquilino}`);
  }
};

// Notificación: Día del vencimiento
const notifyExpiryDay = async (now: Date) => {
  const hoy = new Date(now);
  
  const suscripciones = await prisma.suscripciones.findMany({
    where: {
      estado_suscripcion: 'pago_vencido', // Ya cambió a pago_vencido
      fecha_renovacion: {
        gte: new Date(hoy.setHours(0, 0, 0, 0)),
        lte: new Date(hoy.setHours(23, 59, 59, 999))
      }
    },
    include: {
      inquilinos: true,
      Planes: true
    }
  });

  for (const suscripcion of suscripciones) {
    const titulo = '💳 Tu suscripción ha vencido - 3 días de gracia';
    const mensaje = `
Hola ${suscripcion.inquilinos.nombre_inquilino},

Tu suscripción al plan "${suscripcion.Planes.nombre_plan}" venció hoy, pero no te preocupes.

Tienes 3 días de gracia para resolver cualquier problema con tu método de pago. Durante este tiempo, mantienes acceso completo al servicio.

Por favor, actualiza tu información de pago lo antes posible.

Saludos,
Equipo de Soporte
    `.trim();

    await sendEmail(
      suscripcion.inquilinos.email_inquilino,
      titulo,
      mensaje
    );
    
    console.log(`📧 Notificación vencimiento enviada a: ${suscripcion.inquilinos.email_inquilino}`);
  }
};

// Notificación: 1 día en período de gracia
const notifyGraceDay1 = async (now: Date) => {
  const ayer = new Date(now);
  ayer.setDate(now.getDate() - 1);
  
  const suscripciones = await prisma.suscripciones.findMany({
    where: {
      estado_suscripcion: 'pago_vencido',
      fecha_renovacion: {
        gte: new Date(ayer.setHours(0, 0, 0, 0)),
        lte: new Date(ayer.setHours(23, 59, 59, 999))
      }
    },
    include: {
      inquilinos: true,
      Planes: true
    }
  });

  for (const suscripcion of suscripciones) {
    const titulo = '⏰ Te quedan 2 días de gracia';
    const mensaje = `
Hola ${suscripcion.inquilinos.nombre_inquilino},

Tu suscripción lleva 1 día vencida. Te quedan 2 días de gracia antes de que se suspenda tu acceso.

Plan: ${suscripcion.Planes.nombre_plan}
Fecha de vencimiento: ${suscripcion.fecha_renovacion.toLocaleDateString()}

Por favor, actualiza tu método de pago urgentemente.

Saludos,
Equipo de Soporte
    `.trim();

    await sendEmail(
      suscripcion.inquilinos.email_inquilino,
      titulo,
      mensaje
    );
    
    console.log(`📧 Notificación gracia día 1 enviada a: ${suscripcion.inquilinos.email_inquilino}`);
  }
};

// Notificación: 2 días en período de gracia (último día)
const notifyGraceDay2 = async (now: Date) => {
  const hace2Dias = new Date(now);
  hace2Dias.setDate(now.getDate() - 2);
  
  const suscripciones = await prisma.suscripciones.findMany({
    where: {
      estado_suscripcion: 'pago_vencido',
      fecha_renovacion: {
        gte: new Date(hace2Dias.setHours(0, 0, 0, 0)),
        lte: new Date(hace2Dias.setHours(23, 59, 59, 999))
      }
    },
    include: {
      inquilinos: true,
      Planes: true
    }
  });

  for (const suscripcion of suscripciones) {
    const titulo = '🚨 ÚLTIMO DÍA - Tu acceso se suspende mañana';
    const mensaje = `
Hola ${suscripcion.inquilinos.nombre_inquilino},

Este es tu último día de gracia. Mañana se suspenderá tu acceso al sistema si no actualizas tu método de pago.

Plan: ${suscripcion.Planes.nombre_plan}
Fecha de vencimiento: ${suscripcion.fecha_renovacion.toLocaleDateString()}

¡ACCIÓN URGENTE REQUERIDA!

Actualiza tu método de pago ahora para evitar la suspensión del servicio.

Saludos,
Equipo de Soporte
    `.trim();

    await sendEmail(
      suscripcion.inquilinos.email_inquilino,
      titulo,
      mensaje
    );
    
    console.log(`📧 Notificación último día enviada a: ${suscripcion.inquilinos.email_inquilino}`);
  }
};

