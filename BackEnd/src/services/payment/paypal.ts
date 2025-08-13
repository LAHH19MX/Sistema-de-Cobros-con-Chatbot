const paypal = require('@paypal/checkout-server-sdk');
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/client';
import { getIO } from '../../common/config/socket';
import { Decimal } from '@prisma/client/runtime/library';
import axios from 'axios';

function buildPayPalClient(clientId: string, clientSecret: string) {
  const env = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(env);
}

export async function createPaypalLink(idDeuda: string): Promise<string> {
  const deuda = await prisma.deuda.findUnique({ 
    where: { id_deuda: idDeuda } 
  });
  if (!deuda) throw new Error('Deuda no encontrada');

  const cliente = await prisma.cliente.findUnique({ 
    where: { id_cliente: deuda.id_cliente } 
  });
  if (!cliente) throw new Error('Cliente no encontrado');

  const cred = await prisma.clave_pasarelas.findFirst({
    where: { 
      id_inquilino: cliente.id_inquilino, 
      pasarela: 'paypal' 
    }
  });
  if (!cred) throw new Error('Credencial PayPal no encontrada');

  if (!cred || !cred.client_secret) {
    throw new Error('Credencial PayPal o client_secret ausente');
  }
  
  const client = buildPayPalClient(cred.credenciales_api, cred.client_secret);

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: `${idDeuda}_${cliente.id_inquilino}`, // AGREGADO id_inquilino
      amount: {
        currency_code: 'MXN',
        value: deuda.saldo_pendiente.toNumber().toFixed(2)
      },
      custom_id: cliente.id_inquilino // AGREGADO para identificar inquilino
    }],
    application_context: {
      return_url: `${process.env.BASE_URL_BACK}/paypal/success`,
      cancel_url: `${process.env.BASE_URL_BACK}/paypal/cancel`
    }
  });

  const order = await client.execute(request);
  const orderId = order.result.id;
  const approveLink = order.result.links!
    .find((l: any) => l.rel === 'approve')!.href;

  await prisma.enlace_pago.create({
    data: {
      id_enlace: uuidv4(),
      id_deuda: idDeuda,
      id_credencial: cred.id_credencial,
      id_exterior: orderId,
      url: approveLink,
      monto: deuda.saldo_pendiente,
      estado: 'pendiente',
      vence_en: null       
    }
  });

  return approveLink;
}

// MODIFICADO: Ahora acepta headers, webhook_id e inquilinoId
// MODIFICADO: Ahora acepta headers, webhook_id e inquilinoId
export async function handlePaypalWebhook(
  evt: any, 
  headers?: any, 
  webhookId?: string, 
  inquilinoId?: string
): Promise<void> {
  const io = getIO();
  
  console.log(`Procesando evento PayPal ${evt.event_type} para inquilino: ${inquilinoId || 'DEFAULT'}`);

  // Si se proporciona webhookId, verificar el webhook
  if (webhookId && headers) {
    const isValid = await verifyPayPalWebhook(evt, headers, webhookId);
    if (!isValid) {
      console.error('PayPal webhook verification failed');
      throw new Error('Invalid PayPal webhook signature');
    }
  }
  
  if (evt.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return;

  const capture = evt.resource;
  const orderId = capture.supplementary_data.related_ids.order_id;
  
  // Verificar que corresponde al inquilino correcto
  if (inquilinoId && capture.custom_id) {
    if (capture.custom_id !== inquilinoId) {
      console.error(`Webhook mismatch: esperado ${inquilinoId}, recibido ${capture.custom_id}`);
      return;
    }
  }

  const feeStr = capture.seller_receivable_breakdown.paypal_fee.value;
  const netStr = capture.seller_receivable_breakdown.net_amount.value;
  const fee = parseFloat(feeStr);
  const net = parseFloat(netStr);

  const enlace = await prisma.enlace_pago.findFirst({
    where: { id_exterior: orderId, estado: 'pendiente' }
  });
  if (!enlace) return;

  const deuda = await prisma.deuda.findUnique({
    where: { id_deuda: enlace.id_deuda },
    include: { Cliente: true }
  });

  if (!deuda) throw new Error('Deuda no encontrada');

  // VALIDACIÓN AGREGADA: Verificar que la deuda esté en estado válido para pago
  if (!['pendiente', 'vencido'].includes(deuda.estado_deuda)) {
    console.error(`Intento de pago en deuda con estado inválido: ${deuda.estado_deuda} para deuda ${deuda.id_deuda}`);
    throw new Error(`No se puede procesar pago para deuda en estado: ${deuda.estado_deuda}`);
  }

  // VALIDACIÓN AGREGADA: Verificar que la deuda tenga saldo pendiente
  if (deuda.saldo_pendiente <= new Decimal(0)) {
    console.error(`Intento de pago en deuda sin saldo pendiente: ${deuda.saldo_pendiente} para deuda ${deuda.id_deuda}`);
    throw new Error('No se puede procesar pago para deuda sin saldo pendiente');
  }

  const montoAPagar = enlace.monto || new Decimal(0);
  const montoNeto = new Decimal(net);

  console.log(`Procesando pago PayPal para deuda ${deuda.id_deuda} (estado: ${deuda.estado_deuda} -> pagado)`);

  await prisma.$transaction([
    prisma.enlace_pago.update({
      where: { id_enlace: enlace.id_enlace },
      data: {
        estado: 'pagado',
        pagado_en: new Date(capture.update_time),
        comision: fee,
        monto_neto: net
      }
    }),
    
    // COMENTARIO AGREGADO: Cambiar estado de pendiente/vencido a pagado
    prisma.deuda.update({
      where: { id_deuda: enlace.id_deuda },
      data: { 
        saldo_pendiente: 0, 
        estado_deuda: 'pagado' 
      }
    }),
    
    prisma.historialPago.create({
      data: {
        id_pago: uuidv4(),
        id_deuda: enlace.id_deuda,
        id_cliente: deuda.id_cliente,
        fecha_pago: new Date(capture.update_time),
        importe: montoNeto,
        referencia_pago: capture.id,
        concepto: deuda.descripcion,
        observaciones: `Pago procesado via PayPal - Estado anterior: ${deuda.estado_deuda}`,
        estado_pago: 'pagado',
        metodo_pago: 'paypal'
      }
    })
  ]);

  if (io) {
    io.to(`inquilino_${deuda.Cliente.id_inquilino}`).emit('pago:received', {
      id_deuda: enlace.id_deuda,
      id_cliente: deuda.id_cliente,
      monto: montoAPagar.toNumber(),
      metodo: 'paypal',
      fecha: new Date(capture.update_time).toISOString(),
      estado_anterior: deuda.estado_deuda // AGREGADO: informar estado previo
    });

    io.to(`inquilino_${deuda.Cliente.id_inquilino}`).emit('deuda:updated', {
      id_deuda: enlace.id_deuda,
      estado: 'pagado',
      saldo_pendiente: 0
    });
  }
}

// NUEVA FUNCIÓN: Verificar webhook de PayPal
async function verifyPayPalWebhook(
  webhookEvent: any, 
  headers: any, 
  webhookId: string
): Promise<boolean> {
  try {
    // Obtener credenciales para la verificación
    const cred = await prisma.clave_pasarelas.findFirst({
      where: { 
        webhook_id: webhookId,
        pasarela: 'paypal'
      }
    });

    if (!cred) {
      console.error('No se encontraron credenciales para webhook_id:', webhookId);
      return false;
    }

    // Obtener token de acceso de PayPal
    const auth = Buffer.from(`${cred.credenciales_api}:${cred.client_secret}`).toString('base64');
    const tokenResponse = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/oauth2/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Verificar el webhook
    const verifyResponse = await axios.post(
      'https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature',
      {
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: webhookEvent
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return verifyResponse.data.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verificando webhook PayPal:', error);
    return false;
  }
}

export async function capturePaypalOrder(token: string): Promise<boolean> {
  try {
    // Buscar el enlace por el token (order ID)
    const enlace = await prisma.enlace_pago.findFirst({
      where: { 
        id_exterior: token,
        estado: 'pendiente'
      }
    });

    if (!enlace) {
      console.log('No se encontró enlace pendiente para token:', token);
      return false;
    }

    // Obtener credenciales
    const cred = await prisma.clave_pasarelas.findUnique({
      where: { id_credencial: enlace.id_credencial }
    });

    if (!cred || !cred.client_secret) {
      throw new Error('Credenciales PayPal no encontradas');
    }

    const client = buildPayPalClient(cred.credenciales_api, cred.client_secret);

    // Capturar la orden
    const request = new paypal.orders.OrdersCaptureRequest(token);
    request.requestBody({});
    
    const capture = await client.execute(request);
    
    console.log('Orden capturada:', capture.result.id);
    console.log('Estado:', capture.result.status);
    
    return capture.result.status === 'COMPLETED';
  } catch (error) {
    console.error('Error capturando orden PayPal:', error);
    return false;
  }
}