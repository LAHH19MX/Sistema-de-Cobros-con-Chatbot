import { Request, Response } from 'express'
import { prisma } from '../../../db/client'
import { emitToInquilino } from '../../../common/config/socket'

// Obtener estadísticas para widgets
export const getStats = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const currentDate = new Date()
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    
    // Total clientes registrados este mes
    const totalClientes = await prisma.cliente.count({
      where: {
        id_inquilino,
        fecha_registro: {
          gte: firstDayOfMonth
        }
      }
    })

    // Pagos cobrados este mes
    const pagosCobrados = await prisma.historialPago.count({
      where: {
        Cliente: {
          id_inquilino
        },
        estado_pago: 'pagado',
        fecha_pago: {
          gte: firstDayOfMonth
        }
      }
    })

    // Deudas pendientes de este mes
    const deudasPendientes = await prisma.deuda.count({
      where: {
        Cliente: {
          id_inquilino
        },
        saldo_pendiente: {
          gt: 0
        }
      }
    })

    res.json({
      totalClientes,
      totalCobrado: pagosCobrados,
      deudasPendientes
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo estadísticas' })
  }
}

// Obtener últimos 5 enlaces
export const getUltimosEnlaces = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    
    const enlaces = await prisma.enlace_pago.findMany({
      where: {
        deudas: {
          Cliente: {
            id_inquilino
          }
        }
      },
      include: {
        deudas: {
          include: {
            Cliente: {
              select: {
                nombre_cliente: true,
                apellido_paterno: true
              }
            }
          }
        }
      },
      orderBy: {
        creado_en: 'desc'
      },
      take: 5
    })

    // Formatear respuesta
    const enlacesFormateados = enlaces.map(enlace => ({
      nombre: `${enlace.deudas.Cliente.nombre_cliente} ${enlace.deudas.Cliente.apellido_paterno}`,
      fecha: enlace.estado === 'pagado' ? enlace.pagado_en :
             enlace.estado === 'expirado' ? enlace.vence_en :
             enlace.creado_en,
      referencia: enlace.url,
      estado: enlace.estado,
      concepto: enlace.deudas.descripcion,
      monto: enlace.monto_neto
    }))

    res.json(enlacesFormateados)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo enlaces' })
  }
}