import cron from 'node-cron';
import { runRecordatorios } from './Recordatorios';
import { runSubscriptionMaintenance } from '../suscripciones/SubscriptionMaintenance';

cron.schedule(
  '*/15 * * * *',
  () => { 
    runRecordatorios().catch(console.error) 
    runSubscriptionMaintenance().catch(console.error);
  },
  { timezone: 'America/Mexico_City' }
);
