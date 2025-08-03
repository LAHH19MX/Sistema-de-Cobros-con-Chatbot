export interface DeudaFormData {
  monto_original: string;
  descripcion: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  id_cliente: string;
}

export interface DeudaValidationErrors {
  [key: string]: string;
}

export const validateDeudaForm = (data: DeudaFormData): DeudaValidationErrors => {
  const errors: DeudaValidationErrors = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Monto
  const monto = parseFloat(data.monto_original);
  if (!data.monto_original || isNaN(monto)) {
    errors.monto_original = 'El monto es requerido';
  } else if (monto <= 0) {
    errors.monto_original = 'El monto debe ser mayor a 0';
  } else if (monto > 999999.99) {
    errors.monto_original = 'El monto no puede exceder $999,999.99';
  }

  // Descripción
  if (!data.descripcion.trim()) {
    errors.descripcion = 'La descripción es requerida';
  } else if (data.descripcion.length < 5) {
    errors.descripcion = 'La descripción debe tener al menos 5 caracteres';
  } else if (data.descripcion.length > 200) {
    errors.descripcion = 'La descripción no puede exceder 200 caracteres';
  }

  // Fecha de emisión
  if (!data.fecha_emision) {
    errors.fecha_emision = 'La fecha de emisión es requerida';
  }

  // Fecha de vencimiento
  if (!data.fecha_vencimiento) {
    errors.fecha_vencimiento = 'La fecha de vencimiento es requerida';
  } else {
    const fechaEmision = new Date(data.fecha_emision);
    const fechaVencimiento = new Date(data.fecha_vencimiento);
    
    if (fechaVencimiento <= fechaEmision) {
      errors.fecha_vencimiento = 'La fecha de vencimiento debe ser posterior a la fecha de emisión';
    }
  }

  // Cliente
  if (!data.id_cliente) {
    errors.id_cliente = 'Debe seleccionar un cliente';
  }

  return errors;
};

// Formatear monto como moneda mientras se escribe
export const formatCurrency = (value: string): string => {
  // Eliminar todo excepto números y punto
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  // Asegurar solo un punto decimal
  const parts = cleanValue.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limitar decimales a 2
  if (parts[1]?.length > 2) {
    return parts[0] + '.' + parts[1].substring(0, 2);
  }
  
  return cleanValue;
};