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
  plan: Planes; // Usar tipo exacto generado por Prisma
  renewDate: Date;
  gateway: Gateway;
}

// Un solo declare global con ambas propiedades
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