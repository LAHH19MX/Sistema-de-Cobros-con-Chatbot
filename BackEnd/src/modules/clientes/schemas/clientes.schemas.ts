import { z } from 'zod'

export const createClienteSchema = z.object({
  nombre_cliente: z.string().min(1, 'Nombre requerido'),
  apellido_paterno: z.string().min(1, 'Apellido paterno requerido'),
  apellido_materno: z.string().optional(),
  email_cliente: z.string().email('Email inválido'),
  telefono_cliente: z.string().min(1, 'Teléfono requerido'),
  direccion_cliente: z.string().optional()
})

export const updateClienteSchema = createClienteSchema.partial()