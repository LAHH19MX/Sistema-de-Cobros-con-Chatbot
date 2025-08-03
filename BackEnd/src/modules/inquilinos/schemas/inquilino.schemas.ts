import { z } from 'zod';

// Definimos el esquema base sin .refine() para el middleware
const baseSchema = z.object({
  nombre_inquilino: z.string({
    required_error: 'El nombre es requerido',
    invalid_type_error: 'El nombre debe ser texto'
  })
  .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  .optional(),

  apellido_paterno: z.string({
    required_error: 'El apellido paterno es requerido',
    invalid_type_error: 'El apellido debe ser texto'
  })
  .min(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  .optional(),

  apellido_materno: z.string({
    invalid_type_error: 'El apellido debe ser texto'
  })
  .optional()
  .nullable(),

  email_inquilino: z.string({
    required_error: 'El email es requerido',
    invalid_type_error: 'El email debe ser texto'
  })
  .email({ message: 'Email inválido' })
  .optional(),

  telefono_inquilino: z.string({
    invalid_type_error: 'El teléfono debe ser texto'
  })
  .regex(/^[0-9]{10}$/, { message: 'El teléfono debe tener 10 dígitos' })
  .optional()
  .nullable(),

  direccion_inquilino: z.string({
    invalid_type_error: 'La dirección debe ser texto'
  })
  .optional()
  .nullable(),

  estado_inquilino: z.boolean({
    invalid_type_error: 'El estado debe ser verdadero/falso'
  })
  .optional(),

  foto_inquilino: z.string({
    invalid_type_error: 'La foto debe ser una URL'
  })
  .url({ message: 'URL de foto inválida' })
  .optional()
  .nullable(),

  plan_id: z.string({
    invalid_type_error: 'El ID del plan debe ser texto'
  })
  .uuid({ message: 'ID de plan inválido' })
  .optional(),

  estado_suscripcion: z.enum(
    ['active', 'pending', 'canceled', 'expired'], 
    {
      errorMap: () => ({ message: 'Estado de suscripción inválido' })
    }
  )
  .optional(),

  fecha_renovacion: z.coerce.date({
    invalid_type_error: 'Fecha de renovación inválida'
  })
  .optional()
});

// Exportamos el esquema base para el middleware
export const updateInquilinoSchema = baseSchema;

// Tipo TypeScript para inferencia
export type UpdateInquilinoInput = z.infer<typeof baseSchema>;