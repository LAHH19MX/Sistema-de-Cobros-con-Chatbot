const paypal = require('@paypal/checkout-server-sdk');
import { v4 as uuidv4 }    from 'uuid';
import { prisma }          from '../../db/client';

function buildPayPalClient(clientId: string, clientSecret: string) {
  const env = new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(env);
}

export async function createPaypalLink(idDeuda: string): Promise<string> {
  // Busca deuda
  const deuda   = await prisma.deuda.findUnique({ where: { id_deuda: idDeuda } });
  if (!deuda) throw new Error('Deuda no encontrada');

  //Busca al cliente
  const cliente = await prisma.cliente.findUnique({ where: { id_cliente: deuda.id_cliente } });
  if (!cliente) throw new Error('Cliente no encontrado');

  const cred    = await prisma.clave_pasarelas.findFirst({
    where: { id_inquilino: cliente.id_inquilino, pasarela: 'paypal' }
  });
  if (!cred) throw new Error('Credencial PayPal no encontrada');

  if (!cred || !cred.client_secret) {
    throw new Error('Credencial PayPal o client_secret ausente');
  }
  const client  = buildPayPalClient(cred.credenciales_api, cred.client_secret);

  //Busca la orden
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id : idDeuda,
      amount       : {
        currency_code: 'MXN',
        value        : deuda.saldo_pendiente.toNumber().toFixed(2)
      }
    }],
    application_context: {
      return_url: 'https://1ab7-201-97-18-186.ngrok-free.app/paypal/success',
      cancel_url: 'https://1ab7-201-97-18-186.ngrok-free.app/paypal/cancel'
    }
  });

  const order = await client.execute(request);
  const orderId = order.result.id;
  const approveLink = order.result.links!
  .find((l: any) => l.rel === 'approve')!.href;

  // Guarda enlace
  await prisma.enlace_pago.create({
    data: {
      id_enlace    : uuidv4(),
      id_deuda     : idDeuda,
      id_credencial: cred.id_credencial,
      id_exterior  : orderId,
      url          : approveLink,
      monto        : deuda.saldo_pendiente,
      estado       : 'pendiente',
      vence_en     : null       
    }
  });

  return approveLink; //Regresa el link
}

export async function handlePaypalWebhook(evt: any): Promise<void> {
  if (evt.event_type !== 'PAYMENT.CAPTURE.COMPLETED') return;

  const capture     = evt.resource;                       
  const orderId     = capture.supplementary_data.related_ids.order_id;
  const feeStr      = capture.seller_receivable_breakdown.paypal_fee.value;
  const netStr      = capture.seller_receivable_breakdown.net_amount.value;
  const fee         = parseFloat(feeStr);
  const net         = parseFloat(netStr);

  const enlace = await prisma.enlace_pago.findFirst({
    where: { id_exterior: orderId, estado: 'pendiente' }
  });
  if (!enlace) return;       

  await prisma.$transaction([
    prisma.enlace_pago.update({
      where: { id_enlace: enlace.id_enlace },
      data : {
        estado    : 'pagado',
        pagado_en : new Date(capture.update_time),
        comision  : fee,
        monto_neto: net
      }
    }),
    prisma.deuda.update({
      where: { id_deuda: enlace.id_deuda },
      data : { saldo_pendiente: 0, estado_deuda: 'PAGADA' }
    })
  ]);
}
