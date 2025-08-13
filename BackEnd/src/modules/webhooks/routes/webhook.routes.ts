  import { Router } from 'express';
  import { stripeWebhook, paypalWebhook } from '../controller/webhook.controller';
  import express from 'express';

  const router = Router();

  // Stripe webhook
  router.post('/stripe', 
    express.raw({ type: 'application/json' }), 
    stripeWebhook
  );

  // PayPal webhook 
  router.post('/paypal', 
    express.json(), 
    paypalWebhook
  );

  export default router;