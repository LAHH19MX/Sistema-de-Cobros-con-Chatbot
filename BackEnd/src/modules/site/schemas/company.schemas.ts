import { z } from 'zod';

// Empresa schemas
export const createCompanySchema = z.object({
  nombre_empresa: z.string({
    required_error: "El nombre de la empresa es requerido"
  }).min(1),
  logo_empresa: z.string({
    required_error: "El logo de la empresa es requerido"
  }).optional(),
  telefono_empresa: z.string({
    required_error: "El numero de telefono es requerido"
  }).optional(),
  email_empresa: z.string({
    required_error: "El email de la empresa es requerido"
  }).email(),
  estado_empresa: z.string({
    required_error: "El estado de la empresa es requerido"
  }).optional(),
  ciudad_empresa: z.string({
    required_error: "La ciudad de la empresa es requerido"
  }).optional(),
  codigo_postal_empresa: z.string({
    required_error: "El codigo postal de la empresa es requerido"
  }).optional(),
  calle_empresa: z.string({
    required_error: "La calle de la empresa es requerido"
  }).optional(),
  colonia_empresa: z.string({
    required_error: "La colonia de la empresa es requerido"
  }).optional(),
  latitud_empresa: z.string({
    required_error: "La latitud de la empresa es requerido"
  }).optional(),
  longitud_empresa: z.string({
    required_error: "La latitud de la empresa es requerido"
  }).optional(),
});

export const createRedSocialSchema = z.object({
  nombre_red: z.string().min(1),
  logo_red: z.string().optional(),
  enlace: z.string(),
  id_empresa: z.string().uuid(),
});
