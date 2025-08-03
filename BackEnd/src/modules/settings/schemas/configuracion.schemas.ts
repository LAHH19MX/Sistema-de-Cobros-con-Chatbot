import { z } from 'zod'

export const updateConfiguracionSchema = z.object({
  motivo: z.string().min(1, 'El motivo es requerido').optional(),
  mensaje_pre_vencimiento: z.string().min(1, 'El mensaje pre-vencimiento es requerido').optional(),
  mensaje_post_vencimiento: z.string().min(1, 'El mensaje post-vencimiento es requerido').optional(),
  frecuencia: z.number().min(1).optional()
})