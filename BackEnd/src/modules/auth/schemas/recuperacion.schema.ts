import { z } from 'zod';

// Schema para solicitar recuperación
export const solicitarRecuperacionSchema = z.object({
    email: z.string().email('Email inválido')
});

// Schema para validar código
export const validarCodigoSchema = z.object({
    email: z.string().email('Email inválido'),
    codigo: z.string().length(6, 'El código debe tener 6 dígitos')
});

// Schema para reenviar código
export const reenviarCodigoSchema = z.object({
    email: z.string().email('Email inválido')
});

// Schema para restablecer contraseña
export const restablecerPasswordSchema = z.object({
    email: z.string().email('Email inválido'),
    codigo: z.string().length(6, 'El código debe tener 6 dígitos'),
    nuevaPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});
