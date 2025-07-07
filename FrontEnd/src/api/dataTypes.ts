// src/types/index.ts
// Centraliza todos los tipos aquí y exporta desde un solo lugar

export interface Empresa {
  id_empresa: string;
  nombre_empresa: string;
  logo_empresa?: string;
  telefono_empresa?: string;
  email_empresa: string;
  estado_empresa?: string;
  ciudad_empresa?: string;
  codigo_postal_empresa?: string;
  calle_empresa?: string;
  colonia_empresa?: string;
  latitud_empresa?: string;
  longitud_empresa?: string;
}

export interface RedSocial {
  id_red: string;
  nombre_red: string;
  logo_red?: string;
  enlace: string;
  id_empresa: string;
}

export interface Apartado {
  id_apartado: string;
  nombre_apartado: string;
  id_empresa: string;
  id_plantilla: string;
  activo_apartado: boolean;
  mostrar_categoria: boolean;
  fecha_creacion?: string;
}

export interface Categoria {
  id_categoria: string;
  nombre_categoria: string;
  titulo_categoria?: string;  
  texto_categoria?: string;
  imagen_categoria?: string;
  fecha_creacion?: string;  
  activo_categoria?: boolean;
  id_apartado: string;
}

export interface Seccion {
  id_seccion: string;
  titulo_seccion: string;
  texto_seccion?: string;
  imagen_url?: string;
  activo_seccion?: boolean;
  tipo_seccion: string;
  fecha_creacion?: string;
  id_categoria?: string;
  contenido?: Contenido[];
}

export interface Contenido {
  id_contenido: string;
  titulo_contenido: string;
  texto_contenido?: string;
  multimedia_url?: string;
  id_seccion: string;
}
