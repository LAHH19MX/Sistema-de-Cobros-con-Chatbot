import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/client';
import { getIO } from '../../common/config/socket';
import { Decimal } from '@prisma/client/runtime/library';

export async function createStripeLink(idDeuda: string): Promise<string> {
  
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
      pasarela: 'stripe'
    }
  });
  if (!cred) throw new Error('Credencial de Stripe no encontrada');

  const stripe = new Stripe(cred.credenciales_api, {
    apiVersion: '2025-06-30.basil'
  });

  const price = await stripe.prices.create({
    currency: 'mxn',
    unit_amount: deuda.saldo_pendiente.toNumber() * 100,
    product_data: { name: `Deuda ${idDeuda}` }
  });

  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { 
      id_deuda: idDeuda,
      id_inquilino: cliente.id_inquilino  
    }
  });

  await prisma.enlace_pago.create({
    data: {
      id_enlace: uuidv4(),
      id_deuda: idDeuda,
      id_credencial: cred.id_credencial,
      id_exterior: link.id,
      url: link.url,
      monto: deuda.saldo_pendiente,
      estado: 'pendiente',
      vence_en: null              
    }
  });

  return link.url;
}

// MODIFICADO: Ahora acepta inquilinoId opcional
export async function handleStripeEvent(event: Stripe.Event, inquilinoId?: string): Promise<void> {
  const io = getIO();

  // Log para debug
  console.log(`Procesando evento Stripe ${event.type} para inquilino: ${inquilinoId || 'DEFAULT'}`);

  if (event.type === 'payment_link.updated') {
    const pl = event.data.object as Stripe.PaymentLink;
    if (!pl.active) {
      await prisma.enlace_pago.updateMany({
        where: { id_exterior: pl.id },
        data: { estado: 'expirado' }
      });
    }
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // VERIFICACIÓN: Confirmar que el pago corresponde al inquilino correcto
    if (inquilinoId && session.metadata?.id_inquilino) {
      if (session.metadata.id_inquilino !== inquilinoId) {
        console.error(`Webhook mismatch: esperado ${inquilinoId}, recibido ${session.metadata.id_inquilino}`);
        return;
      }
    }

    // DEBUG: Log para verificar qué se está buscando
    console.log(`Buscando enlace con id_exterior: ${session.payment_link} y estado: pendiente`);

    const enlace = await prisma.enlace_pago.findFirst({
      where: { 
        id_exterior: session.payment_link as string, 
        estado: 'pendiente' 
      }
    });
    
    if (!enlace) {
      console.error(`No se encontró enlace pendiente para payment_link: ${session.payment_link}`);
      return;
    }

    console.log(`Enlace encontrado: ${enlace.id_enlace} para deuda: ${enlace.id_deuda}`);

    const cred = await prisma.clave_pasarelas.findUnique({
      where: { id_credencial: enlace.id_credencial }
    });
    if (!cred) throw new Error('Credencial Stripe no encontrada');

    const stripe = new Stripe(cred.credenciales_api, { apiVersion: '2025-06-30.basil' });

    async function getBalanceTx(piId: string, max = 3): Promise<Stripe.BalanceTransaction> {
      for (let i = 0; i < max; i++) {
        const pi = await stripe.paymentIntents.retrieve(
          piId,
          { expand: ['latest_charge.balance_transaction'] }
        );
        const tx = (pi.latest_charge as any)?.balance_transaction as Stripe.BalanceTransaction;
        if (tx) return tx;
        await new Promise(r => setTimeout(r, 1000));   
      }
      throw new Error('balance_transaction no disponible tras reintentos');
    }

    const balTx = await getBalanceTx(session.payment_intent as string);
    const fee = balTx.fee / 100;
    const net = balTx.net / 100;

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

    console.log(`Procesando pago Stripe para deuda ${deuda.id_deuda} (estado: ${deuda.estado_deuda} -> pagado)`);
    console.log(`Actualizando enlace ${enlace.id_enlace} de pendiente a pagado`);
    
    await prisma.$transaction([
      // ACTUALIZAR (no insertar) el enlace existente
      prisma.enlace_pago.update({
        where: { id_enlace: enlace.id_enlace },
        data: {
          estado: 'pagado',
          pagado_en: new Date(),
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
          fecha_pago: new Date(),
          importe: montoNeto,
          referencia_pago: session.payment_intent as string,
          concepto: deuda.descripcion,
          observaciones: `Pago procesado via Stripe`,
          estado_pago: 'pagado',
          metodo_pago: 'stripe'
        }
      })
    ]);

    if (io) {
      io.to(`inquilino_${deuda.Cliente.id_inquilino}`).emit('pago:received', {
        id_deuda: enlace.id_deuda,
        id_cliente: deuda.id_cliente,
        monto: montoAPagar.toNumber(),
        metodo: 'stripe',
        fecha: new Date().toISOString(),
        estado_anterior: deuda.estado_deuda // AGREGADO: informar estado previo
      });

      io.to(`inquilino_${deuda.Cliente.id_inquilino}`).emit('deuda:updated', {
        id_deuda: enlace.id_deuda,
        estado: 'pagado',
        saldo_pendiente: 0
      });
    }

    console.log(`✅ Pago Stripe procesado: Deuda ${enlace.id_deuda} (${deuda.estado_deuda} -> pagado) - Enlace ${enlace.id_enlace} actualizado - Monto: $${montoAPagar.toNumber()}`);
  }
}