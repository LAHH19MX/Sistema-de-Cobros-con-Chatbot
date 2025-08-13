// webhookStripe.routes.ts - CORREGIDO para inquilinos individuales
import express from 'express';
import Stripe from 'stripe';
import { handleStripeEvent } from '../services/payment/stripe';
import { prisma } from '../db/client';

const router = express.Router();

router.post('/:inquilinoId', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const { inquilinoId } = req.params;
  
  try {
    // Obtener el webhook secret del inquilino
    const credencial = await prisma.clave_pasarelas.findFirst({
      where: { 
        id_inquilino: inquilinoId,
        pasarela: 'stripe'
      }
    });

    if (!credencial || !credencial.webhook_secret) {
      console.error(`No se encontró webhook_secret para inquilino ${inquilinoId}`);
      return res.status(404).send('Configuración de webhook no encontrada');
    }

    // Verificar con el secret del inquilino
    const event = Stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      credencial.webhook_secret  
    );
    
    // Pasar el inquilinoId al handler para contexto
    await handleStripeEvent(event, inquilinoId);
    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }
});

// Mantener ruta original para compatibilidad (opcional)
router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = Stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET_PAYMENT!
    );
    
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }
});

export default router;