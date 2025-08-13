import express from 'express';
import { handlePaypalWebhook } from '../services/payment/paypal';
import { prisma } from '../db/client';

const router = express.Router();

// Nueva ruta dinámica para cada inquilino
router.post('/:inquilinoId', express.json({ type: '*/*' }), async (req, res) => {
  const { inquilinoId } = req.params;
  
  try {
    // Obtener las credenciales del inquilino para verificación
    const credencial = await prisma.clave_pasarelas.findFirst({
      where: { 
        id_inquilino: inquilinoId,
        pasarela: 'paypal'
      }
    });

    if (!credencial || !credencial.webhook_id) {
      console.error(`No se encontró webhook_id para inquilino ${inquilinoId}`);
      return res.status(404).send('Configuración de webhook no encontrada');
    }
    
    // Pasar el webhook_id y inquilinoId al handler
    await handlePaypalWebhook(req.body, req.headers, credencial.webhook_id, inquilinoId);
    res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook PayPal error', e);
    res.status(500).send('err');
  }
});

// Mantener ruta original para compatibilidad (opcional)
router.post('/', express.json({ type: '*/*' }), async (req, res) => {
  try {
    await handlePaypalWebhook(req.body);
    res.status(200).send('OK');
  } catch (e) {
    console.error('Webhook PayPal error', e);
    res.status(500).send('err');
  }
});

export default router;