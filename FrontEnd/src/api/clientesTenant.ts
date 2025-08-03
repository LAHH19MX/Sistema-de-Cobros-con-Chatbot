import api from './axios';

export interface ClienteTenant {
  id_cliente: string;
  nombre_cliente: string;
  apellido_paterno: string;
  apellido_materno?: string;
  email_cliente: string;
  telefono_cliente: string;
  direccion_cliente?: string;
  estado_cliente: string;
  fecha_registro: string;
}

export interface ClientesResponse {
  data: ClienteTenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Listar clientes
export const getClientes = (params?: { page?: number; limit?: number; search?: string }) =>
  api.get<ClientesResponse>('/tenant/clientes', { params });

// Obtener cliente por ID
export const getClienteById = (id: string) =>
  api.get<ClienteTenant>(`/tenant/clientes/${id}`);

// Crear cliente
export const createCliente = (data: Omit<ClienteTenant, 'id_cliente' | 'fecha_registro' | 'estado_cliente'>) =>
  api.post<ClienteTenant>('/tenant/clientes', data);

// Actualizar cliente
export const updateCliente = (id: string, data: Partial<ClienteTenant>) =>
  api.put<ClienteTenant>(`/tenant/clientes/${id}`, data);

// Eliminar cliente
export const deleteCliente = (id: string) =>
  api.delete(`/tenant/clientes/${id}`);