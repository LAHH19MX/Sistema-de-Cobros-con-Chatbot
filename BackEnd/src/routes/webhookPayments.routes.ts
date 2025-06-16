import express from 'express';
import { handleStripeEvent } from '../services/payment/stripe';

const router = express.Router();

// 1) Stripe envía JSON aquí (checkout.session.completed / payment_link.expired)
router.post('/', express.json(), async (req, res) => {
  try {
    await handleStripeEvent(req.body);
    return res.json({ received: true });
  } catch (err) {
    console.error('Error Stripe webhook:', err);
    return res.status(500).send('Server error');
  }
});

export default router;
