import { z } from 'zod'

export const upsertPasarelaSchema = z.object({
  pasarela: z.enum(['stripe', 'paypal']),
  credenciales_api: z.string().min(1, 'Las credenciales API son requeridas'),
  client_secret: z.string().optional()
})

export const updateEstadoSchema = z.object({
  estado: z.enum(['ACTIVO', 'INACTIVO'])
})