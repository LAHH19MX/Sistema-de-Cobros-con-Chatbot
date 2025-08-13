import { Request, Response } from 'express'
import { prisma } from '../../../db/client'
import { incrementResourceUsage, canUseResource } from '../../subscriptions/controller/resourceUtils'
import { emitToInquilino } from '../../../common/config/socket'

// Listar todos los clientes del inquilino
export const getClientes = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const search = req.query.search as string || ''
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 8
    
    // Construir filtros
    const where: any = {
      id_inquilino
    }
    
    if (search) {
      where.OR = [
        { email_cliente: { contains: search, mode: 'insensitive' } },
        { telefono_cliente: { contains: search } },
        { nombre_cliente: { contains: search, mode: 'insensitive' } },
        { apellido_paterno: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Ejecutar consulta con paginación
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { fecha_registro: 'desc' }
      }),
      prisma.cliente.count({ where })
    ])
    
    res.json({
      data: clientes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo clientes' })
  }
}

// Obtener un cliente por ID
export const getClienteById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    
    const cliente = await prisma.cliente.findFirst({
      where: { 
        id_cliente: id,
        id_inquilino 
      }
    })
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo cliente' })
  }
}

// Crear nuevo cliente
export const createCliente = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { 
      nombre_cliente, 
      apellido_paterno, 
      apellido_materno,
      email_cliente,
      telefono_cliente,
      direccion_cliente 
    } = req.body
    
    // Verifivar rescursos antes de crear
    const canCreate = await canUseResource(id_inquilino, 'clientes')
    
    if (!canCreate.canUse) {
      return res.status(403).json({ 
        error: canCreate.message || 'Has alcanzado el límite de clientes',
        clientesRestantes: canCreate.remaining || 0
      })
    }
    
    // Verificar si el email ya existe
    const emailExiste = await prisma.cliente.findUnique({
      where: { email_cliente }
    })
    
    if (emailExiste) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }
    
    // Verificar si el teléfono ya existe
    const telefonoExiste = await prisma.cliente.findFirst({
      where: { telefono_cliente }
    })
    
    if (telefonoExiste) {
      return res.status(400).json({ error: 'El teléfono ya está registrado' })
    }
    
    const cliente = await prisma.cliente.create({
      data: {
        nombre_cliente,
        apellido_paterno,
        apellido_materno,
        email_cliente,
        telefono_cliente,
        direccion_cliente,
        estado_cliente: 'true',
        id_inquilino
      }
    })
    
    const resourceUpdate = await incrementResourceUsage(id_inquilino, 'clientes')
    
    // Emitir evento Socket.io
    emitToInquilino(id_inquilino, 'cliente:created', cliente)
    
    res.status(201).json({
      ...cliente,
      _recursos: {
        clientesUsados: resourceUpdate.currentUsage,
        clientesRestantes: resourceUpdate.limit !== -1 
          ? (resourceUpdate.limit || 0) - (resourceUpdate.currentUsage || 0)
          : 'ilimitado'
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error creando cliente' })
  }
}

// Actualizar cliente
export const updateCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    const {
      nombre_cliente,
      apellido_paterno,
      apellido_materno,
      email_cliente,
      telefono_cliente,
      direccion_cliente
    } = req.body
    
    // Verificar que el cliente pertenezca al inquilino
    const clienteExiste = await prisma.cliente.findFirst({
      where: { 
        id_cliente: id,
        id_inquilino 
      }
    })
    
    if (!clienteExiste) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    // Si cambia el email, verificar que no exista
    if (email_cliente && email_cliente !== clienteExiste.email_cliente) {
      const emailDuplicado = await prisma.cliente.findUnique({
        where: { email_cliente }
      })
      
      if (emailDuplicado) {
        return res.status(400).json({ error: 'El email ya está en uso' })
      }
    }
    
    // Si cambia el teléfono, verificar que no exista
    if (telefono_cliente && telefono_cliente !== clienteExiste.telefono_cliente) {
      const telefonoDuplicado = await prisma.cliente.findFirst({
        where: { telefono_cliente }
      })
      
      if (telefonoDuplicado) {
        return res.status(400).json({ error: 'El teléfono ya está en uso' })
      }
    }
    
    const cliente = await prisma.cliente.update({
      where: { id_cliente: id },
      data: {
        nombre_cliente,
        apellido_paterno,
        apellido_materno,
        email_cliente,
        telefono_cliente,
        direccion_cliente
      }
    })
    
    // Emitir evento Socket.io
    emitToInquilino(id_inquilino, 'cliente:updated', cliente)
    
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: 'Error actualizando cliente' })
  }
}

// Eliminar cliente
export const deleteCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    
    // Verificar que el cliente pertenezca al inquilino
    const cliente = await prisma.cliente.findFirst({
      where: { 
        id_cliente: id,
        id_inquilino 
      }
    })
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    // Verificar que no tenga deudas
    const tieneDeudas = await prisma.deuda.count({
      where: { 
        id_cliente: id,
        saldo_pendiente: { gt: 0 }
      }
    })
    
    if (tieneDeudas > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un cliente con deudas pendientes' })
    }
    
    await prisma.cliente.delete({
      where: { id_cliente: id }
    })
    
    // Emitir evento Socket.io
    emitToInquilino(id_inquilino, 'cliente:deleted', { id_cliente: id })
    
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando cliente' })
  }
}