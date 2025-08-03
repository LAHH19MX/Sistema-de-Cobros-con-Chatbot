import { z } from 'zod';

// Schema para crear checkout
export const createCheckoutSchema = z.object({
  planId: z.string().uuid('ID de plan debe ser un UUID válido'),
  gateway: z.enum(['stripe', 'paypal'], {
    errorMap: () => ({ message: 'Gateway debe ser stripe o paypal' })
  })
});

// Schema para cambiar plan
export const changePlanSchema = z.object({
  planId: z.string().uuid('ID de plan debe ser un UUID válido'),
  gateway: z.enum(['stripe', 'paypal'], {
    errorMap: () => ({ message: 'Gateway debe ser stripe o paypal' })
  })
});

// Tipos para TypeScript
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type ChangePlanInput = z.infer<typeof changePlanSchema>;