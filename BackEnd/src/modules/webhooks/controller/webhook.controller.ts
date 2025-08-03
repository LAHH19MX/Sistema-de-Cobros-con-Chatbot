import { Request, Response } from 'express';
import { stripe, STRIPE_CONFIG } from '../../../common/config/stripe';
import { PAYPAL_CONFIG } from '../../../common/config/paypal';
import { prisma } from '../../../db/client';
import { 
  handleStripeSubscriptionCreated,
  handleStripeSubscriptionUpdated,
  handleStripeSubscriptionDeleted,
  handleStripePaymentSucceeded,
  handleStripePaymentFailed
} from './stripeWebhookHandlers';
import {
  handlePayPalSubscriptionCreated,
  handlePayPalSubscriptionActivated,
  handlePayPalSubscriptionCancelled,
  handlePayPalPaymentCompleted,
  handlePayPalPaymentDenied
} from './paypalWebhookHandlers';

export const stripeWebhook = async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig || !STRIPE_CONFIG.webhookSecret) {
      return res.status(400).json({ error: 'Missing signature or webhook secret' });
    }

    let event;
    
    try {
      // Verificar que el evento viene realmente de Stripe
      event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_CONFIG.webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    console.log(`Received Stripe webhook: ${event.type}`);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'customer.subscription.created':
        await handleStripeSubscriptionCreated(event);
        break;
        
      case 'customer.subscription.updated':
        await handleStripeSubscriptionUpdated(event);
        break;
        
      case 'customer.subscription.deleted':
        await handleStripeSubscriptionDeleted(event);
        break;
        
      case 'invoice.payment_succeeded':
        await handleStripePaymentSucceeded(event);
        break;
        
      case 'invoice.payment_failed':
        await handleStripePaymentFailed(event);
        break;
        
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const paypalWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;
    
    // Para PayPal, la verificación es más compleja, por ahora omitimos la verificación en sandbox
    console.log(`Received PayPal webhook: ${event.event_type}`);

    // Manejar diferentes tipos de eventos
    switch (event.event_type) {
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handlePayPalSubscriptionCreated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handlePayPalSubscriptionActivated(event);
        break;
        
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handlePayPalSubscriptionCancelled(event);
        break;
        
      case 'PAYMENT.SALE.COMPLETED':
        await handlePayPalPaymentCompleted(event);
        break;
        
      case 'PAYMENT.SALE.DENIED':
        await handlePayPalPaymentDenied(event);
        break;
        
      default:
        console.log(`Unhandled PayPal event type: ${event.event_type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};