import { Router } from 'express';
import { stripeWebhook, paypalWebhook } from '../controller/webhook.controller';
import express from 'express';

const router = Router();

// Stripe webhook - requiere raw body para verificar signature
router.post('/stripe', 
  express.raw({ type: 'application/json' }), 
  stripeWebhook
);

// PayPal webhook - puede usar JSON normal
router.post('/paypal', 
  express.json(), 
  paypalWebhook
);

export default router;