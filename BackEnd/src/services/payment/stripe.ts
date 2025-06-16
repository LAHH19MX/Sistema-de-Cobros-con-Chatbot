// src/services/payments/stripe.ts
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../db/client';

/*──────────────────────────────────────────────
  1. CREAR LINK DE PAGO – PRISMA
──────────────────────────────────────────────*/
export async function createStripeLink(idDeuda: string): Promise<string> {
  /* a) Deuda + credencial */
  const deuda = await prisma.deuda.findUnique({
    where: { id_deuda: idDeuda }
  });
  if (!deuda) throw new Error('Deuda no encontrada');

  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: deuda.id_cliente }
  });
  if (!cliente) throw new Error('Cliente no encontrado');

  const cred = await prisma.clave_pasarelas.findFirst({
    where: { id_inquilino: cliente.id_inquilino }
  });
  if (!cred) throw new Error('Credencial de Stripe no encontrada');

  /* b) Stripe con la clave de ese inquilino */
  const stripe = new Stripe(cred.credenciales_api, {
    apiVersion: '2025-05-28.basil'
  });

  /* c) Precio ad-hoc */
  const price = await stripe.prices.create({
    currency: 'mxn',
    unit_amount: deuda.saldo_pendiente.toNumber() * 100,
    product_data: { name: `Deuda ${idDeuda}` }
  });

  /* d) Payment Link (sin expiración configurable en la API actual) */
  const link = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: { id_deuda: idDeuda }
  });

  /* e) Guarda enlace */
  await prisma.enlace_pago.create({
    data: {
      id_enlace:     uuidv4(),
      id_deuda:      idDeuda,
      id_credencial: cred.id_credencial,
      id_exterior:   link.id,
      url:           link.url,
      monto:         deuda.saldo_pendiente,
      estado:        'pendiente',
      vence_en:      null               // Stripe ya lo desactiva automáticamente
    }
  });

  return link.url;
}

/*──────────────────────────────────────────────
  2. HANDLER WEBHOOK – PRISMA
──────────────────────────────────────────────*/
export async function handleStripeEvent(event: Stripe.Event): Promise<void> {

  /* A. Enlace expirado (Payment Link pasa a inactive) */
  if (event.type === 'payment_link.updated') {
    const pl = event.data.object as Stripe.PaymentLink;
    if (!pl.active) {
      await prisma.enlace_pago.updateMany({
        where: { id_exterior: pl.id },
        data:  { estado: 'expirado' }
      });
    }
    return;
  }

  /* B. Pago completado */
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // 1. Localiza tu enlace pendiente
    const enlace = await prisma.enlace_pago.findFirst({
      where: { id_exterior: session.payment_link as string, estado: 'pendiente' }
    });
    if (!enlace) return;                    // idempotencia

    // 2. Obtén la credencial Stripe de ese enlace
    const cred = await prisma.clave_pasarelas.findUnique({
      where: { id_credencial: enlace.id_credencial }
    });
    if (!cred) throw new Error('Cred Stripe no encontrada');

    const stripe = new Stripe(cred.credenciales_api, { apiVersion: '2025-05-28.basil' });

    // 3. Helper: reintenta hasta obtener balance_transaction
    async function getBalanceTx(piId: string, max = 3): Promise<Stripe.BalanceTransaction> {
      for (let i = 0; i < max; i++) {
        const pi = await stripe.paymentIntents.retrieve(
          piId,
          { expand: ['latest_charge.balance_transaction'] }
        );
        const tx = (pi.latest_charge as any)?.balance_transaction as Stripe.BalanceTransaction;
        if (tx) return tx;
        await new Promise(r => setTimeout(r, 1000));   // espera 1 s
      }
      throw new Error('balance_transaction no disponible tras reintentos');
    }

    // 4. Carga PaymentIntent → comisión y neto
    const balTx = await getBalanceTx(session.payment_intent as string);
    const fee   = balTx.fee / 100;
    const net   = balTx.net / 100;

    // 5. Actualiza enlace y deuda
    await prisma.$transaction([
      prisma.enlace_pago.update({
        where: { id_enlace: enlace.id_enlace },
        data: {
          estado:     'pagado',
          pagado_en:  new Date(),
          comision:   fee,
          monto_neto: net
        }
      }),
      prisma.deuda.update({
        where: { id_deuda: enlace.id_deuda },
        data:  { saldo_pendiente: 0, estado_deuda: 'PAGADA' }
      })
    ]);
  }
}