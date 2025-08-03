import { z } from 'zod'

export const updatePerfilSchema = z.object({
  nombre_inquilino: z.string().min(1).optional(),
  apellido_paterno: z.string().min(1).optional(),
  apellido_materno: z.string().optional(),
  telefono_inquilino: z.string().optional(),
  direccion_inquilino: z.string().optional(),
  foto_inquilino: z.string().url().optional()
})

export const changePasswordSchema = z.object({
  password_actual: z.string().min(1, 'Contraseña actual requerida'),
  password_nueva: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmar_password: z.string().min(1, 'Confirmación requerida')
})