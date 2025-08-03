export interface ClienteFormData {
  nombre_cliente: string;
  apellido_paterno: string;
  apellido_materno: string;
  email_cliente: string;
  telefono_cliente: string;
  direccion_cliente: string;
}

export interface ValidationErrors {
  [key: string]: string;
}

export const validateClienteForm = (data: ClienteFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Nombre
  if (!data.nombre_cliente.trim()) {
    errors.nombre_cliente = 'El nombre es requerido';
  } else if (data.nombre_cliente.length < 2) {
    errors.nombre_cliente = 'El nombre debe tener al menos 2 caracteres';
  } else if (data.nombre_cliente.length > 50) {
    errors.nombre_cliente = 'El nombre no puede exceder 50 caracteres';
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.nombre_cliente)) {
    errors.nombre_cliente = 'El nombre solo puede contener letras';
  }

  // Apellido Paterno
  if (!data.apellido_paterno.trim()) {
    errors.apellido_paterno = 'El apellido paterno es requerido';
  } else if (data.apellido_paterno.length < 2) {
    errors.apellido_paterno = 'El apellido debe tener al menos 2 caracteres';
  } else if (data.apellido_paterno.length > 50) {
    errors.apellido_paterno = 'El apellido no puede exceder 50 caracteres';
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.apellido_paterno)) {
    errors.apellido_paterno = 'El apellido solo puede contener letras';
  }

  // Apellido Materno (opcional)
  if (data.apellido_materno && data.apellido_materno.trim()) {
    if (data.apellido_materno.length < 2) {
      errors.apellido_materno = 'El apellido debe tener al menos 2 caracteres';
    } else if (data.apellido_materno.length > 50) {
      errors.apellido_materno = 'El apellido no puede exceder 50 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(data.apellido_materno)) {
      errors.apellido_materno = 'El apellido solo puede contener letras';
    }
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email_cliente.trim()) {
    errors.email_cliente = 'El email es requerido';
  } else if (!emailRegex.test(data.email_cliente)) {
    errors.email_cliente = 'El email no es válido';
  } else if (data.email_cliente.length > 100) {
    errors.email_cliente = 'El email no puede exceder 100 caracteres';
  }

  // Teléfono
  const phoneRegex = /^\d{10}$/;
  const cleanPhone = data.telefono_cliente.replace(/\D/g, '');
  if (!data.telefono_cliente.trim()) {
    errors.telefono_cliente = 'El teléfono es requerido';
  } else if (!phoneRegex.test(cleanPhone)) {
    errors.telefono_cliente = 'El teléfono debe tener 10 dígitos';
  }

  // Dirección
  if (!data.direccion_cliente.trim()) {
    errors.direccion_cliente = 'La dirección es requerida';
  } else if (data.direccion_cliente.length < 10) {
    errors.direccion_cliente = 'La dirección debe ser más específica';
  } else if (data.direccion_cliente.length > 200) {
    errors.direccion_cliente = 'La dirección no puede exceder 200 caracteres';
  }

  return errors;
};

// Formatear teléfono mientras se escribe
export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  return value;
};

// Limpiar solo números del teléfono
export const cleanPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};