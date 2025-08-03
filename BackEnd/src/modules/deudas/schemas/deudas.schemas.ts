import { z } from 'zod'

export const createDeudaSchema = z.object({
  monto_original: z.number().positive('El monto debe ser positivo'),
  descripcion: z.string().min(1, 'Descripción requerida'),
  fecha_emision: z.string().datetime(),
  fecha_vencimiento: z.string().datetime(),
  id_cliente: z.string().uuid('ID de cliente inválido')
})

export const updateDeudaSchema = z.object({
  monto_original: z.number().positive().optional(),
  saldo_pendiente: z.number().min(0).optional(),
  descripcion: z.string().min(1).optional(),
  fecha_vencimiento: z.string().datetime().optional(),
  estado_deuda: z.enum(['pendiente', 'pagado', 'vencido']).optional()
})