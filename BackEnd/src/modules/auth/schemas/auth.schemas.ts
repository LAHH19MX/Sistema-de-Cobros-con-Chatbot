import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email({ message: 'Formato de email inválido' }),
  contra: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña no puede estar vacía'),
});
