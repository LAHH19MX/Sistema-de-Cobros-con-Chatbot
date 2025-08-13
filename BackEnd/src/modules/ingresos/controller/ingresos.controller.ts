import { Request, Response } from 'express'
import { prisma } from '../../../db/client'

// Obtener datos para gráfica de ingresos
export const getIngresosGrafica = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { periodo = 'mensual', año, mes } = req.query
    
    const currentYear = año ? parseInt(año as string) : new Date().getFullYear()
    const currentMonth = mes ? parseInt(mes as string) : new Date().getMonth() + 1
    
    let startDate: Date
    let endDate: Date
    let groupBy: string
    
    // Determinar rango de fechas según el periodo
    switch (periodo) {
      case 'mensual':
        // Últimos 12 meses
        startDate = new Date(currentYear - 1, currentMonth, 1)
        endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        groupBy = 'month'
        break
        
      case 'trimestral':
        // Últimos 4 trimestres (1 año)
        startDate = new Date(currentYear - 1, currentMonth, 1)
        endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59)
        groupBy = 'quarter'
        break
        
      case 'anual':
        // Últimos 5 años
        startDate = new Date(currentYear - 4, 0, 1)
        endDate = new Date(currentYear, 11, 31, 23, 59, 59)
        groupBy = 'year'
        break
        
      default:
        return res.status(400).json({ error: 'Periodo inválido' })
    }
    
    // Obtener pagos completados en el rango
    const pagos = await prisma.historialPago.findMany({
      where: {
        Cliente: { id_inquilino },
        estado_pago: 'pagado',
        fecha_pago: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        importe: true,
        fecha_pago: true
      },
      orderBy: { fecha_pago: 'asc' }
    })
    
    // Agrupar datos según el periodo
    const datosAgrupados = agruparPorPeriodo(pagos, periodo as string)
    
    // Calcular totales
    const totalIngresos = pagos.reduce((sum, pago) => sum + Number(pago.importe), 0)
    const promedioMensual = totalIngresos / 12;
    
    res.json({
      periodo,
      rango: {
        desde: startDate,
        hasta: endDate
      },
      totales: {
        ingresoTotal: totalIngresos,
        cantidadPagos: pagos.length,
        promedioMensual
      },
      datos: datosAgrupados
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo datos de ingresos' })
  }
}

// Función auxiliar para agrupar por periodo
function agruparPorPeriodo(pagos: any[], periodo: string) {
    const grupos: { [key: string]: { label: string; total: number; cantidad: number } } = {}
    
    pagos.forEach(pago => {
      const fecha = new Date(pago.fecha_pago)
      let key: string
      let label: string
      
      switch (periodo) {
        case 'mensual':
          key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`
          label = fecha.toLocaleDateString('es-MX', { year: 'numeric', month: 'short' })
          break
          
        case 'trimestral':
          const quarter = Math.floor(fecha.getMonth() / 3) + 1
          key = `${fecha.getFullYear()}-Q${quarter}`
          label = `${fecha.getFullYear()} T${quarter}`
          break
          
        case 'anual':
          key = fecha.getFullYear().toString()
          label = fecha.getFullYear().toString()
          break
          
        default:
          key = fecha.toISOString()
          label = fecha.toLocaleDateString()
      }
      
      if (!grupos[key]) {
        grupos[key] = { label, total: 0, cantidad: 0 }
      }
      
      grupos[key].total += Number(pago.importe)
      grupos[key].cantidad += 1
    })
    
    // Convertir a array y ordenar
    return Object.entries(grupos)
      .map(([key, data]) => ({
        periodo: data.label,
        total: data.total,
        cantidad: data.cantidad,
        promedio: data.total / data.cantidad
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
}

// Obtener tabla de pagos completados
export const getPagosCompletados = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { 
      desde, 
      hasta,
      id_cliente,
      page = 1,
      limit = 8 
    } = req.query
    
    // Construir filtros
    const where: any = {
      Cliente: { id_inquilino },
      estado_pago: 'pagado'
    }
    
    // Filtro de fechas
    if (desde && hasta) {
      where.fecha_pago = {
        gte: new Date(desde as string),
        lte: new Date(hasta as string)
      }
    }
    
    // Filtro por cliente
    if (id_cliente) {
      where.id_cliente = id_cliente
    }
    
    // Ejecutar consulta con paginación
    const [pagos, total] = await Promise.all([
      prisma.historialPago.findMany({
        where,
        include: {
          Cliente: {
            select: {
              nombre_cliente: true,
              apellido_paterno: true,
              apellido_materno: true,
              email_cliente: true
            }
          },
          Deuda: {
            select: {
              descripcion: true,
              monto_original: true,
              saldo_pendiente: true
            }
          }
        },
        orderBy: { fecha_pago: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit)
      }),
      prisma.historialPago.count({ where })
    ])
    
    // Formatear respuesta
    const pagosFormateados = pagos.map(pago => ({
      id_pago: pago.id_pago,
      cliente: {
        nombreCompleto: `${pago.Cliente.nombre_cliente} ${pago.Cliente.apellido_paterno} ${pago.Cliente.apellido_materno || ''}`.trim(),
        email: pago.Cliente.email_cliente
      },
      deuda: {
        descripcion: pago.Deuda.descripcion,
        montoOriginal: pago.Deuda.monto_original,
        montoNeto: pago.Deuda.saldo_pendiente
      },
      pago: {
        fechaPago: pago.fecha_pago,
        importe: pago.importe,
        referencia: pago.referencia_pago,
        concepto: pago.concepto,
        Neto: pago.metodo_pago,
        observaciones: pago.observaciones
      }
    }))
    
    res.json({
      data: pagosFormateados,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo pagos completados' })
  }
}

// Generar reporte de ingresos
export const generarReporteIngresos = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { desde, hasta, id_cliente } = req.query
    
    // Validar fechas requeridas
    if (!desde || !hasta) {
      return res.status(400).json({ error: 'Las fechas desde y hasta son requeridas' })
    }
    
    // Construir filtros
    const where: any = {
      Cliente: { id_inquilino },
      estado_pago: 'pagado',
      fecha_pago: {
        gte: new Date(desde as string),
        lte: new Date(hasta as string)
      }
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
    
    // Obtener empresa
    const empresa = await prisma.empresa.findFirst({
      select: {
        nombre_empresa: true,
        logo_empresa: true
      }
    })
    
    // Obtener pagos con información relacionada
    const pagos = await prisma.historialPago.findMany({
      where,
      include: {
        Cliente: {
          select: {
            nombre_cliente: true,
            apellido_paterno: true,
            apellido_materno: true,
            email_cliente: true
          }
        },
        Deuda: {
          select: {
            descripcion: true
          }
        }
      },
      orderBy: { fecha_pago: 'desc' }
    })
    
    // Obtener información de enlaces de pago para el método
    const pagosConEnlaces = await Promise.all(
      pagos.map(async (pago) => {
        // Buscar el enlace de pago relacionado
        const enlacePago = await prisma.enlace_pago.findFirst({
          where: {
            id_deuda: pago.id_deuda,
            estado: 'pagado',
            pagado_en: {
              gte: new Date(pago.fecha_pago.getTime() - 60000),
              lte: new Date(pago.fecha_pago.getTime() + 60000)
            }
          },
          include: {
            clave_pasarelas: {
              select: {
                pasarela: true
              }
            }
          }
        })
        
        return {
          nombreCompleto: `${pago.Cliente.nombre_cliente} ${pago.Cliente.apellido_paterno} ${pago.Cliente.apellido_materno || ''}`.trim(),
          email: pago.Cliente.email_cliente,
          metodo: enlacePago ? enlacePago.clave_pasarelas.pasarela : 'Manual',
          descripcion: pago.Deuda.descripcion,
          fechaPago: pago.fecha_pago,
          montoNeto: pago.importe
        }
      })
    )
    
    // Calcular totales
    const totalIngresos = pagos.reduce((sum, pago) => sum + Number(pago.importe), 0)
    
    res.json({
      empresa: empresa ? {
        nombre: empresa.nombre_empresa,
        logo: empresa.logo_empresa
      } : null,
      inquilino: `${inquilino.nombre_inquilino} ${inquilino.apellido_paterno} ${inquilino.apellido_materno || ''}`.trim(),
      fechaGeneracion: new Date(),
      periodo: { desde, hasta },
      resumen: {
        totalPagos: pagos.length,
        totalIngresos
      },
      datos: pagosConEnlaces
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error generando reporte de ingresos' })
  }
}

