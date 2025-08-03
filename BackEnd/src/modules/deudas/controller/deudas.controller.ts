import { Request, Response } from 'express'
import { prisma } from '../../../db/client'
import { primerEmail } from '../../../services/recordatorios/IniciosEmails'
import { emitToInquilino } from '../../../common/config/socket'

// Obtener contadores para widgets
export const getWidgetsDeudas = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Inicio del día
    
    // Contar deudas pendientes (saldo > 0 y no vencidas)
    const pendientes = await prisma.deuda.count({
      where: {
        Cliente: { id_inquilino },
        saldo_pendiente: { gt: 0 },
        fecha_vencimiento: { gte: hoy },
        estado_deuda: 'pendiente'
      }
    })
    
    // Contar deudas pagadas
    const pagadas = await prisma.deuda.count({
      where: {
        Cliente: { id_inquilino },
        estado_deuda: 'pagado'
      }
    })
    
    // Contar deudas vencidas (saldo > 0 y fecha pasada)
    const vencidas = await prisma.deuda.count({
      where: {
        Cliente: { id_inquilino },
        saldo_pendiente: { gt: 0 },
        fecha_vencimiento: { lt: hoy },
        estado_deuda: 'vencido'
      }
    })
    
    res.json({
      pendientes,
      pagadas,
      vencidas
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo widgets de deudas' })
  }
}

// Listar todas las deudas con información del cliente
export const getDeudas = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 8
    
    const where = {
      Cliente: { id_inquilino }
    }
    
    const [deudas, total] = await Promise.all([
      prisma.deuda.findMany({
        where,
        include: {
          Cliente: {
            select: {
              nombre_cliente: true,
              apellido_paterno: true,
              apellido_materno: true,
              email_cliente: true,
              telefono_cliente: true
            }
          }
        },
        orderBy: { fecha_emision: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.deuda.count({ where })
    ])
    
    res.json({
      data: deudas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo deudas' })
  }
}

// Obtener una deuda por ID
export const getDeudaById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    
    const deuda = await prisma.deuda.findFirst({
      where: {
        id_deuda: id,
        Cliente: { id_inquilino }
      },
      include: {
        Cliente: {
          select: {
            nombre_cliente: true,
            apellido_paterno: true,
            apellido_materno: true,
            email_cliente: true,
            telefono_cliente: true
          }
        }
      }
    })
    
    if (!deuda) {
      return res.status(404).json({ error: 'Deuda no encontrada' })
    }
    
    res.json(deuda)
  } catch (error) {
    res.status(500).json({ error: 'Error obteniendo deuda' })
  }
}

// Crear nueva deuda
export const createDeuda = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const {
      monto_original,
      descripcion,
      fecha_emision,
      fecha_vencimiento,
      id_cliente
    } = req.body
    
    // Verificar que el cliente pertenezca al inquilino
    const clienteValido = await prisma.cliente.findFirst({
      where: {
        id_cliente,
        id_inquilino
      }
    })
    
    if (!clienteValido) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    // Crear la deuda
    const deuda = await prisma.deuda.create({
      data: {
        monto_original,
        saldo_pendiente: monto_original,
        descripcion,
        fecha_emision: new Date(fecha_emision),
        fecha_vencimiento: new Date(fecha_vencimiento),
        estado_deuda: 'pendiente',
        tasa_interes: 0,
        id_cliente
      },
      include: {
        Cliente: {
          select: {
            nombre_cliente: true,
            apellido_paterno: true
          }
        }
      }
    })
    
    // Enviar email de notificación
    try {
      await primerEmail(id_inquilino, id_cliente)
    } catch (emailError) {
      console.error('Error enviando email de notificación:', emailError)
    }
    
    emitToInquilino(id_inquilino, 'deuda:created', deuda)
    
    res.status(201).json(deuda)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error creando deuda' })
  }
}

// Actualizar deuda
export const updateDeuda = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    const {
      monto_original,
      saldo_pendiente,
      descripcion,
      fecha_vencimiento,
      estado_deuda
    } = req.body
    
    // Verificar que la deuda pertenezca a un cliente del inquilino
    const deudaExiste = await prisma.deuda.findFirst({
      where: {
        id_deuda: id,
        Cliente: { id_inquilino }
      }
    })
    
    if (!deudaExiste) {
      return res.status(404).json({ error: 'Deuda no encontrada' })
    }
    
    // Validar que si cambia a pagado, el saldo debe ser 0
    if (estado_deuda === 'pagado' && saldo_pendiente > 0) {
      return res.status(400).json({ 
        error: 'No se puede marcar como pagado con saldo pendiente mayor a 0' 
      })
    }
    
    const deuda = await prisma.deuda.update({
      where: { id_deuda: id },
      data: {
        ...(monto_original !== undefined && { monto_original }),
        ...(saldo_pendiente !== undefined && { saldo_pendiente }),
        ...(descripcion !== undefined && { descripcion }),
        ...(fecha_vencimiento && { fecha_vencimiento: new Date(fecha_vencimiento) }),
        ...(estado_deuda && { estado_deuda })
      },
      include: {
        Cliente: {
          select: {
            nombre_cliente: true,
            apellido_paterno: true
          }
        }
      }
    })
    
    emitToInquilino(id_inquilino, 'deuda:updated', deuda)
    
    if (estado_deuda === 'pagado') {
      emitToInquilino(id_inquilino, 'deuda:paid', deuda)
      emitToInquilino(id_inquilino, 'pago:received', {
        cliente: deuda.Cliente,
        monto: Number(deuda.monto_original),
        descripcion: deuda.descripcion
      })
    }
    
    res.json(deuda)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error actualizando deuda' })
  }
}

export const generarReporteDeudas = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { desde, hasta, estado, id_cliente } = req.query
    
    // Construir filtros
    const where: any = {
      Cliente: { id_inquilino },
      estado_deuda: { not: 'vencido' }  // ← EXCLUIR VENCIDAS
    }
    
    if (desde && hasta) {
      where.fecha_emision = {
        gte: new Date(desde as string),
        lte: new Date(hasta as string)
      }
    }
    
    // Si especifica estado, sobrescribir el filtro
    if (estado && estado !== 'todos') {
      where.estado_deuda = estado
    }
    
    if (id_cliente) {
      where.id_cliente = id_cliente
    }
    
    // Obtener info del inquilino
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino },
      select: {
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true
      }
    })
    
    if (!inquilino) {
      return res.status(404).json({ error: 'Inquilino no encontrado' })
    }
    
    // Obtener empresa (si solo hay una)
    const empresa = await prisma.empresa.findFirst({
      select: {
        nombre_empresa: true,
        logo_empresa: true
      }
    })
    
    // Obtener deudas
    const deudas = await prisma.deuda.findMany({
      where,
      include: {
        Cliente: {
          select: {
            nombre_cliente: true,
            apellido_paterno: true,
            apellido_materno: true,
            email_cliente: true
          }
        }
      },
      orderBy: { fecha_emision: 'desc' }
    })
    
    // Formatear datos
    const datosReporte = deudas.map(deuda => ({
      nombreCompleto: `${deuda.Cliente.nombre_cliente} ${deuda.Cliente.apellido_paterno} ${deuda.Cliente.apellido_materno || ''}`.trim(),
      email: deuda.Cliente.email_cliente,
      descripcion: deuda.descripcion,
      fechaEmision: deuda.fecha_emision,
      fechaVencimiento: deuda.fecha_vencimiento,
      monto: Number(deuda.monto_original),
      pagado: Number(deuda.monto_original) - Number(deuda.saldo_pendiente),
      estado: deuda.estado_deuda
    }))
    
    res.json({
      empresa: empresa ? {
        nombre: empresa.nombre_empresa,
        logo: empresa.logo_empresa
      } : null,
      inquilino: `${inquilino.nombre_inquilino} ${inquilino.apellido_paterno} ${inquilino.apellido_materno || ''}`.trim(),
      fechaGeneracion: new Date(),
      datos: datosReporte
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error generando reporte de deudas' })
  }
}