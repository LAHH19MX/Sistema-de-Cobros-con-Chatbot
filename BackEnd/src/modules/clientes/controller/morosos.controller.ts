import { Request, Response } from 'express'
import { prisma } from '../../../db/client'
import { sendEmail } from '../../../services/recordatorios/ControlEmails'
import { incrementResourceUsage, canUseResource } from '../../subscriptions/controller/resourceUtils'


// Listar clientes morosos con filtros
export const getMorosos = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id
    const { 
      dias_retraso, 
      monto_min, 
      monto_max,
      id_cliente,
      page = 1,
      limit = 8
    } = req.query
    
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    // Filtros base: deudas vencidas con saldo pendiente
    const whereDeuda: any = {
      Cliente: { id_inquilino },
      saldo_pendiente: { gt: 0 },
      fecha_vencimiento: { lt: hoy },
      estado_deuda: 'vencido'
    }
    
    // Filtros opcionales
    if (monto_min || monto_max) {
      whereDeuda.saldo_pendiente = {
        ...(monto_min && { gte: Number(monto_min) }),
        ...(monto_max && { lte: Number(monto_max) })
      }
    }
    
    if (id_cliente) {
      whereDeuda.id_cliente = id_cliente
    }
    
    // Obtener deudas vencidas
    const deudasVencidas = await prisma.deuda.findMany({
      where: whereDeuda,
      include: {
        Cliente: true
      }
    })
    
    // Agrupar por cliente y calcular días de retraso
    const clientesMap = new Map()
    
    deudasVencidas.forEach(deuda => {
      const diasRetraso = Math.floor((hoy.getTime() - new Date(deuda.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24))
      
      // Filtrar por días de retraso si se especificó
      if (dias_retraso && diasRetraso < Number(dias_retraso)) {
        return
      }
      
      const clienteId = deuda.id_cliente
      
      if (!clientesMap.has(clienteId)) {
        clientesMap.set(clienteId, {
          cliente: deuda.Cliente,
          deudas: [],
          montoTotal: 0,
          diasRetrasoMaximo: 0
        })
      }
      
      const clienteData = clientesMap.get(clienteId)
      clienteData.deudas.push({
        ...deuda,
        diasRetraso
      })
      clienteData.montoTotal += Number(deuda.saldo_pendiente)
      clienteData.diasRetrasoMaximo = Math.max(clienteData.diasRetrasoMaximo, diasRetraso)
    })
    
    // Convertir a array y paginar
    const morososArray = Array.from(clientesMap.values())
    const total = morososArray.length
    const startIndex = (Number(page) - 1) * Number(limit)
    const endIndex = startIndex + Number(limit)
    const morososPaginados = morososArray.slice(startIndex, endIndex)
    
    // Formatear respuesta
    const morososFormateados = morososPaginados.map(item => ({
      cliente: {
        id_cliente: item.cliente.id_cliente,
        nombreCompleto: `${item.cliente.nombre_cliente} ${item.cliente.apellido_paterno} ${item.cliente.apellido_materno || ''}`.trim(),
        email: item.cliente.email_cliente,
        telefono: item.cliente.telefono_cliente
      },
      cantidadDeudas: item.deudas.length,
      montoTotal: item.montoTotal,
      diasRetrasoMaximo: item.diasRetrasoMaximo,
      deudas: item.deudas.map((deuda: any) => ({
        id_deuda: deuda.id_deuda,
        descripcion: deuda.descripcion,
        monto: deuda.saldo_pendiente,
        fechaVencimiento: deuda.fecha_vencimiento,
        diasRetraso: deuda.diasRetraso
      }))
    }))
    
    res.json({
      data: morososFormateados,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo clientes morosos' })
  }
}

// Obtener detalle de un moroso específico
export const getMorosoById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
    const hoy = new Date()
    
    // Verificar que el cliente existe y pertenece al inquilino
    const cliente = await prisma.cliente.findFirst({
      where: {
        id_cliente: id,
        id_inquilino
      }
    })
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
    
    // Obtener todas las deudas vencidas del cliente
    const deudasVencidas = await prisma.deuda.findMany({
      where: {
        id_cliente: id,
        saldo_pendiente: { gt: 0 },
        fecha_vencimiento: { lt: hoy },
        estado_deuda: 'vencido'
      },
      orderBy: { fecha_vencimiento: 'asc' }
    })
    
    // Calcular totales y días de retraso
    let montoTotal = 0
    const deudasConRetraso = deudasVencidas.map(deuda => {
      const diasRetraso = Math.floor((hoy.getTime() - new Date(deuda.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24))
      montoTotal += Number(deuda.saldo_pendiente)
      
      return {
        ...deuda,
        diasRetraso
      }
    })
    
    res.json({
      cliente: {
        ...cliente,
        nombreCompleto: `${cliente.nombre_cliente} ${cliente.apellido_paterno} ${cliente.apellido_materno || ''}`.trim()
      },
      resumen: {
        cantidadDeudas: deudasConRetraso.length,
        montoTotal,
        diasRetrasoPromedio: deudasConRetraso.length > 0 
          ? Math.round(deudasConRetraso.reduce((sum, d) => sum + d.diasRetraso, 0) / deudasConRetraso.length)
          : 0
      },
      deudas: deudasConRetraso
    })
    
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error obteniendo detalle del moroso' })
  }
}

// Enviar notificacion de clientes morosos
export const enviarNotificacionMoroso = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const id_inquilino = (req as any).user.id
      
    // Verificar si puede usar el recurso de email
    const canSendEmail = await canUseResource(id_inquilino, 'email')
      
    if (!canSendEmail.canUse) {
      return res.status(403).json({ 
        error: canSendEmail.message || 'No puedes enviar más emails',
        remaining: canSendEmail.remaining || 0
      })
    }
      
    // Verificar que el cliente existe y pertenece al inquilino
    const cliente = await prisma.cliente.findFirst({
      where: {
        id_cliente: id,
        id_inquilino
      }
    })
      
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' })
    }
     
    // Obtener configuración del inquilino
    const configuracion = await prisma.configuracion.findFirst({
      where: { id_inquilino }
    })
      
    if (!configuracion) {
      return res.status(400).json({ error: 'No hay configuración de mensajes. Configure los mensajes primero.' })
    }
      
    // Obtener deudas vencidas del cliente
    const deudasVencidas = await prisma.deuda.findMany({
      where: {
        id_cliente: id,
        saldo_pendiente: { gt: 0 },
        estado_deuda: 'vencido'
      }
    })
      
    if (deudasVencidas.length === 0) {
      return res.status(400).json({ error: 'El cliente no tiene deudas vencidas' })
    }
      
    // Calcular monto total adeudado
    const montoTotal = deudasVencidas.reduce((sum, deuda) => sum + Number(deuda.saldo_pendiente), 0)
    // Enviar email
    try {
    const mensajeExtra = "\n\nPara consultar más información ingrese al WhatsApp a través de la siguiente URL: https://wa.me/123123123 o enviando un mensaje al número +52 123 123 123.";
    const mensajeFinal = (configuracion.mensaje_post_vencimiento ?? '') + mensajeExtra;

    await sendEmail(
      cliente.email_cliente,
      configuracion.motivo,
      mensajeFinal
    );
    
    // Incrementar uso de recursos después de enviar exitosamente
    const resourceUpdate = await incrementResourceUsage(id_inquilino, 'email');
    
    // Registrar el envío
    await prisma.recordatorioEmail.create({
      data: {
        id_inquilino,
        id_cliente: id,
        id_configuracion: configuracion.id_configuracion,
        ultimo_email: new Date(),
        siguiente_email: new Date(Date.now() + (configuracion.frecuencia || 24) * 3600000)
      }
    });
    
    res.json({ 
      message: 'Notificación enviada exitosamente',
      email: cliente.email_cliente,
      recursos: {
        emailsUsados: resourceUpdate.currentUsage,
        emailsRestantes: resourceUpdate.limit !== -1 
          ? (resourceUpdate.limit || 0) - (resourceUpdate.currentUsage || 0)
          : 'ilimitado'
      }
    });

    } catch (emailError) {
      res.status(500).json({ error: 'Error al enviar la notificación por email' });
    }
     
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error procesando notificación' })
  }
}

// Generar reporte de morosos
export const generarReporteMorosos = async (req: Request, res: Response) => {
  try {
    const id_inquilino = (req as any).user.id;
    const { 
      desde, 
      hasta, 
      dias_retraso,
      monto_min,
      monto_max,
      id_cliente 
    } = req.query;
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Construir filtros
    const whereDeuda: any = {
      Cliente: { id_inquilino },
      saldo_pendiente: { gt: 0 },
      estado_deuda: 'vencido'
    };
    
    // Filtro de fechas de vencimiento
    if (desde && hasta) {
      whereDeuda.fecha_vencimiento = {
        gte: new Date(desde as string),
        lte: new Date(hasta as string)
      };
    }
    
    // Filtro de montos (sobre saldo pendiente)
    if (monto_min || monto_max) {
      whereDeuda.saldo_pendiente = {
        gt: 0,
        ...(monto_min && { gte: Number(monto_min) }),
        ...(monto_max && { lte: Number(monto_max) })
      };
    }
    
    // Filtro por cliente específico
    if (id_cliente) {
      whereDeuda.id_cliente = id_cliente;
    }
    
    // Obtener info del inquilino
    const inquilino = await prisma.inquilino.findUnique({
      where: { id_inquilino },
      select: {
        nombre_inquilino: true,
        apellido_paterno: true,
        apellido_materno: true
      }
    });
    
    if (!inquilino) {
      return res.status(404).json({ error: 'Inquilino no encontrado' });
    }
    
    // Obtener empresa
    const empresa = await prisma.empresa.findFirst({
      select: {
        nombre_empresa: true,
        logo_empresa: true
      }
    });
    
    // Obtener deudas vencidas
    const deudasVencidas = await prisma.deuda.findMany({
      where: whereDeuda,
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
      orderBy: { fecha_vencimiento: 'asc' }
    });
    
    // Formatear datos con cambios solicitados
    const datosReporte = deudasVencidas.map(deuda => {
      const diasRetraso = Math.floor((hoy.getTime() - new Date(deuda.fecha_vencimiento).getTime()) / (1000 * 60 * 60 * 24));
      
      // Filtrar por días de retraso si se especificó
      if (dias_retraso && diasRetraso < Number(dias_retraso)) {
        return null;
      }
      
      // Campos separados y sin descripción
      return {
        nombre: deuda.Cliente.nombre_cliente,
        apellidoPaterno: deuda.Cliente.apellido_paterno,
        apellidoMaterno: deuda.Cliente.apellido_materno || '',
        email: deuda.Cliente.email_cliente,
        fechaEmision: deuda.fecha_emision,
        fechaVencimiento: deuda.fecha_vencimiento,
        diasRetraso,
        monto: Number(deuda.saldo_pendiente)
      };
    }).filter(item => item !== null); 
    
    res.json({
      empresa: empresa ? {
        nombre: empresa.nombre_empresa,
        logo: empresa.logo_empresa
      } : null,
      inquilino: {
        nombre: inquilino.nombre_inquilino,
        apellidoPaterno: inquilino.apellido_paterno,
        apellidoMaterno: inquilino.apellido_materno || ''
      },
      fechaGeneracion: new Date(),
      datos: datosReporte
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error generando reporte de morosos' });
  }
};