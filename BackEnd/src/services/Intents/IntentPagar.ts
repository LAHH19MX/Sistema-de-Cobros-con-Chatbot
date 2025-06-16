import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { createStripeLink } from '../payment/stripe';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const respuestasSinDeudaPagar: string[] = [
  "No hay deudas activas para pagar actualmente.",
  "¡Estás al corriente! No tienes pagos pendientes.",
  "No se encontraron deudas a tu nombre, no hay nada que pagar.",
  "Tu cuenta está saldada. No necesitas hacer ningún pago.",
  "No hay importes pendientes para pagar.",
  "En este momento no hay ninguna deuda que requiera tu pago."
];

const respuestasConDeudaPagar: string[] = [
  "Para saldar tu deuda, ingresa al siguiente enlace: ${enlace}.",
  "Puedes realizar tu pago aquí: ${enlace}.",
  "Visita ${enlace} para proceder con tu pago.",
  "Haz clic en ${enlace} para generar tu pago.",
  "El enlace para pagar tu deuda es: ${enlace}.",
  "Realiza tu pago ingresando a: ${enlace}.",
  "Accede a ${enlace} y sigue los pasos para pagar.",
  "Generamos tu enlace de pago: ${enlace}, no lo compartas.",
  "¡Atención! Para abonar tu deuda utiliza: ${enlace}.",
  "Sigue este link para pagar tu adeudo: ${enlace}.",
  "Completa tu pago haciendo clic en: ${enlace}.",
  "Para procesar tu pago, visita: ${enlace}."
];

export async function handleIntentPagar(req: Request, res: Response) {
  const contexts: any[] = req.body.queryResult?.outputContexts || [];
  const contextoIdentificado = contexts.find((c: any) =>
    c.name.endsWith('/contexts/cliente_identificado')
  );

  const session = req.body.session as string;
  const idCliente: string = contextoIdentificado.parameters?.id_cliente;
  if (!idCliente) {
    return res.json({
      fulfillmentText:
        'Hubo un problema al identificarte. Por favor indícame tu correo o teléfono nuevamente.',
      outputContexts: [
        {
          name: `${session}/contexts/awaiting_identificacion`,
          lifespanCount: 1
        }
      ]
    });
  }

  const deudasCliente = await prisma.deuda.findMany({
    where: {
      id_cliente: idCliente,
      estado_deuda: "PENDIENTE"  
    }
  });

  if (!deudasCliente || deudasCliente.length === 0) {
    const textoAleatorio = randomFromArray(respuestasSinDeudaPagar);
    return res.json({ fulfillmentText: textoAleatorio });
  }

  const deudaReciente = deudasCliente.reduce((prev, curr) =>
    curr.fecha_vencimiento > prev.fecha_vencimiento ? curr : prev
  );

  let enlacePago: string;
  try {
    enlacePago = await createStripeLink(deudaReciente.id_deuda);
  } catch (err) {
    console.error('Error creando enlace Stripe:', err);
    return res.json({
      fulfillmentText:
        'Lo siento, hubo un problema generando tu enlace de pago. Intenta más tarde.'
    });
  }
  
  const plantilla = randomFromArray(respuestasConDeudaPagar);
  const respuesta = plantilla.replace('${enlace}', enlacePago);
  
  return res.json({ fulfillmentText: respuesta });
}
