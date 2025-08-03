import { verifyExpiredSubscriptions, cleanOldData, sendSubscriptionNotifications } from './subscriptionTasks';

export const runSubscriptionMaintenance = async () => {
  try {
    console.log('🔄 Iniciando mantenimiento de suscripciones...');
    
    // Verificar suscripciones vencidas (cada 15 minutos)
    await verifyExpiredSubscriptions();
    
    // Solo a las 9:00 AM
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() < 15) {
      
      // Enviar notificaciones de suscripción (una vez al día)
      await sendSubscriptionNotifications();
      
      // Limpiar datos antiguos (solo a las 3:00 AM)
      if (now.getHours() === 3) {
        await cleanOldData();
      }
    }
    
  } catch (error) {
    console.error('Error en mantenimiento de suscripciones:', error);
  }
};