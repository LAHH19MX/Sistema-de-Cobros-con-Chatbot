import cron from 'node-cron';
import { runRecordatorios } from './Recordatorios';
import { runSubscriptionMaintenance } from '../suscripciones/SubscriptionMaintenance';
import { actualizarDeudasVencidas } from './DeudaStatusUpdater';

cron.schedule(
  '*/15 * * * *',
   async () => {
    try {
      // Funcion para el estado de las deudas vencidas
      await actualizarDeudasVencidas();
      
      // Ejecuta los recordatorios
      await runRecordatorios();
      
      // Para suscripciones
      await runSubscriptionMaintenance();
      
    } catch (error) {
      console.error('Error en cron job:', error);
    }
  },
  { timezone: 'America/Mexico_City' }
);
