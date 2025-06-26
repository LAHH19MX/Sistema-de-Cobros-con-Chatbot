import { z } from 'zod';

export const createApartadoSchema = z.object({
  nombre_apartado: z.string({
        required_error: 'El nombre del apartado es requerido' 
    })
    .min(1),
  id_empresa: z.string({
        required_error: 'El id de la empresa es requerido' 
    })
    .uuid(),
  id_plantilla: z.string({
        required_error: 'El id de la plantilla es requerido' 
    })
    .uuid(),
  activo_apartado: z.boolean().default(true),
  mostrar_categoria: z.boolean().default(true),
  fecha_creacion: z.date().default(new Date()),
});

export const createCategoriaSchema = z.object({
  nombre_categoria: z.string({
        required_error: 'El nombre de la categoría es requerido' 
    })
    .min(1),
  titulo_categoria: z.string({
        required_error: "El titulo es requerido"
  }).trim(),
  texto_categoria: z.string({
    required_error: "El texto es requerido"
  }).trim(),
  imagen_categoria: z.string({
    required_error: "La imagen es requerido"
  }).url().trim(),
  activo_categoria: z.boolean().default(true),
  fecha_creacion: z.date().default(new Date())
});