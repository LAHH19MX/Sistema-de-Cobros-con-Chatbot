import { z } from 'zod';

export const createSeccionSchema = z.object({
  titulo_seccion: z
    .string({ required_error: 'El título de la sección es requerido' })
    .min(1),
  texto_seccion: z.string({
    required_error: "El texto es requerido"
  }).trim(),
  imagen_url: z.string({
    required_error: "La imagen es requerida"
  }).trim(),
  activo_seccion: z.boolean().default(true),
  tipo_seccion: z.string().default('general'),
  fecha_creacion: z.date().default(new Date()),
});

export const createContenidoSchema = z.object({
  titulo_contenido: z
    .string({ required_error: 'El título del contenido es requerido' })
    .min(1),
  texto_contenido: z.string({
    required_error: "El texto es requerido"
  }).trim(),
  multimedia_url: z.string({
    required_error: "La multimedia es requerido"
  }).trim(),
});

