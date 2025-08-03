// src/utils/validations.ts

// Expresiones regulares para validaciones
export const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,20}$/;
export const lastNameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{4,20}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const phoneRegex = /^\d{10}$/; // 10 dígitos
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
export const addressRegex = /^[a-zA-Z0-9\s.,#-]{5,100}$/;

// Mensajes de error
export const validationMessages = {
  nombre: 'El nombre debe tener entre 2 y 20 caracteres',
  apellido_paterno: 'El apellido paterno debe tener entre 4 y 20 caracteres',
  apellido_materno: 'El apellido materno debe tener entre 4 y 20 caracteres',
  email: 'Ingresa un correo electrónico válido',
  telefono: 'El teléfono debe tener 10 dígitos',
  password: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
  confirmPassword: 'Las contraseñas no coinciden',
  direccion: 'La dirección debe tener entre 5 y 100 caracteres',
};

// Función para validar todo el formulario
export const validateForm = (formData: any, confirmPassword: string) => {
  const errors: Record<string, string> = {};

  if (!nameRegex.test(formData.nombre)) {
    errors.nombre = validationMessages.nombre;
  }

  if (!lastNameRegex.test(formData.apellido_paterno)) {
    errors.apellido_paterno = validationMessages.apellido_paterno;
  }

  if (!lastNameRegex.test(formData.apellido_materno)) {
    errors.apellido_materno = validationMessages.apellido_materno;
  }

  if (!emailRegex.test(formData.email)) {
    errors.email = validationMessages.email;
  }

  if (!phoneRegex.test(formData.telefono)) {
    errors.telefono = validationMessages.telefono;
  }

  if (!passwordRegex.test(formData.password)) {
    errors.password = validationMessages.password;
  }

  if (formData.password !== confirmPassword) {
    errors.confirmPassword = validationMessages.confirmPassword;
  }

  if (formData.direccion && !addressRegex.test(formData.direccion)) {
    errors.direccion = validationMessages.direccion;
  }

  return errors;
};