import { z } from 'zod';

// Tipos de eventos que manejamos
export const stripeEventTypes = [
  'customer.subscription.created',
  'customer.subscription.updated', 
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed'
] as const;

export const paypalEventTypes = [
  'BILLING.SUBSCRIPTION.CREATED',
  'BILLING.SUBSCRIPTION.ACTIVATED',
  'BILLING.SUBSCRIPTION.CANCELLED', 
  'PAYMENT.SALE.COMPLETED',
  'PAYMENT.SALE.DENIED'
] as const;

// Interfaces para los eventos
export interface StripeWebhookEvent {
  id: string;
  type: typeof stripeEventTypes[number];
  data: {
    object: any;
  };
  created: number;
}

export interface PayPalWebhookEvent {
  id: string;
  event_type: typeof paypalEventTypes[number];
  resource: any;
  create_time: string;
}

// Schemas de validación
export const stripeWebhookSchema = z.object({
  id: z.string(),
  type: z.enum(stripeEventTypes),
  data: z.object({
    object: z.any()
  }),
  created: z.number()
});

export const paypalWebhookSchema = z.object({
  id: z.string(),
  event_type: z.enum(paypalEventTypes),
  resource: z.any(),
  create_time: z.string()
});