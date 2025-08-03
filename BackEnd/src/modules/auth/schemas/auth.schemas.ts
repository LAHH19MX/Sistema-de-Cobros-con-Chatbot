import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es requerido' })
    .email({ message: 'Formato de email inválido' }),
  contra: z
    .string({ required_error: 'La contraseña es requerida' })
    .min(1, 'La contraseña no puede estar vacía'),
});

export const registerSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  apellido_paterno: z.string().min(2, 'Apellido paterno debe tener al menos 2 caracteres'),
  apellido_materno: z.string().min(2, 'Apellido materno debe tener al menos 2 caracteres'),
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'Password debe tener al menos 6 caracteres'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 caracteres'),
  direccion: z.string().optional(), 
  foto: z.string().optional() 
});