import express from 'express';
import { handlePaypalWebhook } from '../services/payment/paypal';

const router = express.Router();

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
