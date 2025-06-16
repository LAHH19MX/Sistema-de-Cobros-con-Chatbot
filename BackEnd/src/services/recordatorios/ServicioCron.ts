import cron from 'node-cron';
import { runRecordatorios } from './Recordatorios';

cron.schedule(
  '*/15 * * * *',
  () => { runRecordatorios().catch(console.error) },
  { timezone: 'America/Mexico_City' }
);
