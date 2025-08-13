import { Planes } from '@prisma/client';

export interface SubscriptionData {
  planId: string;
  inquilinoId: string;
  gateway: 'stripe' | 'paypal';
}

export interface WebhookData {
  eventType: string;
  subscriptionId: string;
  customerId: string;
  status: string;
  gateway: 'stripe' | 'paypal';
}

export type SubscriptionStatus = 'activa' | 'cancelada' | 'pago_vencido' | 'incompleta';
export type Gateway = 'stripe' | 'paypal';

export interface SubscriptionInfo {
  id: string;
  status: SubscriptionStatus;
  plan: Planes; 
  renewDate: Date;
  gateway: Gateway;
}

declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionInfo;
      resourceUsage?: {
        [key: string]: {
          current: number;
          limit: number;
          remaining: number;
        };
      };
    }
  }
}