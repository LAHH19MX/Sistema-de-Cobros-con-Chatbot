// webhookStripe.routes.ts - CORREGIDO
import express from 'express';
import Stripe from 'stripe';
import { handleStripeEvent } from '../services/payment/stripe';

const router = express.Router();

router.post('/', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  
  try {
    const event = Stripe.webhooks.constructEvent(
      req.body, 
      sig, 
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send('Webhook signature verification failed');
  }
});

export default router;