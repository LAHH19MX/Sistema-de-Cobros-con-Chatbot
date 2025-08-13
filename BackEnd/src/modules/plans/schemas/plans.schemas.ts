import { z } from 'zod';

const basePlanSchema = z.object({
  nombre_plan: z.string({
    required_error: 'El nombre del plan es requerido',
    invalid_type_error: 'El nombre debe ser texto'
  }).min(3, 'El nombre debe tener al menos 3 caracteres'),

  descripcion_plan: z.string().optional(),

  precio_plan: z.number({
    required_error: 'El precio es requerido',
    invalid_type_error: 'El precio debe ser un número'
  }).positive('El precio debe ser positivo'),

  whatsapp_incluidos: z.number({
    required_error: 'El número de WhatsApp incluidos es requerido',
    invalid_type_error: 'Debe ser un número'
  }).int().min(0),

  emails_incluidos: z.number({
    required_error: 'El número de emails incluidos es requerido',
    invalid_type_error: 'Debe ser un número'
  }).int().min(0),

  acceso_api: z.boolean({
    required_error: 'El acceso a API es requerido'
  }),

  max_clientes: z.number().int().min(1).optional(),
  stripe_price_id: z.string().optional(),
  paypal_plan_id: z.string().optional()
});

// todos los campos requeridos
export const CreatePlanSchema = basePlanSchema;

//Todos los campos opcionales
export const UpdatePlanSchema = basePlanSchema.partial(); 

// Tipos TypeScript
export type CreatePlanInput = z.infer<typeof CreatePlanSchema>;
export type UpdatePlanInput = z.infer<typeof UpdatePlanSchema>;