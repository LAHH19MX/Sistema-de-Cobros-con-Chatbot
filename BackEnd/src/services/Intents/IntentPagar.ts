import { Request, Response } from 'express';
import { prisma } from '../../db/client';
import { createStripeLink } from '../payment/stripe';
import { createPaypalLink } from '../payment/paypal';

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

const respuestasSeleccionPasarela: string[] = [
  "Tienes una deuda de $${saldo}. ¿Con qué método prefieres pagar?\n\n1._ Stripe (tarjeta)\n2._ PayPal\n\nEscribe 'stripe' o 'paypal'",
  "Tu saldo pendiente es de $${saldo}. Selecciona tu método de pago:\n\n Stripe\n PayPal\n\nResponde con 'stripe' o 'paypal'",
  "Debes $${saldo}. ¿Cómo quieres pagar?\n\n• Stripe (tarjeta de crédito/débito)\nPayPal\n\nEscribe tu preferencia: 'stripe' o 'paypal'"
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
  const contextoSeleccionPago = contexts.find((c: any) =>
    c.name.endsWith('/contexts/seleccion_pago')
  );

  const session = req.body.session as string;
  const idCliente: string = contextoIdentificado?.parameters?.id_cliente;
  const userMessage = req.body.queryResult?.queryText?.toLowerCase() || '';

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

  // Verificar si ya seleccionó método de pago
  if (contextoSeleccionPago) {
    const pasarelaSeleccionada = contextoSeleccionPago.parameters?.pasarela_elegida;
    
    if (pasarelaSeleccionada) {
      // Ya tiene seleccionada la pasarela, generar enlace
      let enlacePago: string;
      try {
        if (pasarelaSeleccionada === 'stripe') {
          enlacePago = await createStripeLink(deudaReciente.id_deuda);
        } else if (pasarelaSeleccionada === 'paypal') {
          enlacePago = await createPaypalLink(deudaReciente.id_deuda);
        } else {
          throw new Error('Pasarela no válida');
        }
      } catch (err) {
        console.error(`Error creando enlace ${pasarelaSeleccionada}:`, err);
        return res.json({
          fulfillmentText: 'Lo siento, hubo un problema generando tu enlace de pago. Intenta más tarde.'
        });
      }
      
      const plantilla = randomFromArray(respuestasConDeudaPagar);
      const respuesta = plantilla.replace('${enlace}', enlacePago);
      
      return res.json({ 
        fulfillmentText: respuesta,
        outputContexts: [
          {
            name: `${session}/contexts/cliente_identificado`,
            lifespanCount: 4,
            parameters: { id_cliente: idCliente }
          }
        ]
      });
    }
  }

  // DETECTAR selección de pasarela en el mensaje
  if (userMessage.includes('stripe') || userMessage.includes('tarjeta')) {
    let enlacePago: string;
    try {
      enlacePago = await createStripeLink(deudaReciente.id_deuda);
    } catch (err) {
      console.error('Error creando enlace Stripe:', err);
      return res.json({
        fulfillmentText: 'Lo siento, hubo un problema generando tu enlace de Stripe. Intenta más tarde.'
      });
    }
    
    const plantilla = randomFromArray(respuestasConDeudaPagar);
    const respuesta = plantilla.replace('${enlace}', enlacePago);
    
    return res.json({ 
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${session}/contexts/cliente_identificado`,
          lifespanCount: 4,
          parameters: { id_cliente: idCliente }
        }
      ]
    });
  }

  if (userMessage.includes('paypal')) {
    let enlacePago: string;
    try {
      enlacePago = await createPaypalLink(deudaReciente.id_deuda);
    } catch (err) {
      console.error('Error creando enlace PayPal:', err);
      return res.json({
        fulfillmentText: 'Lo siento, hubo un problema generando tu enlace de PayPal. Intenta más tarde.'
      });
    }
    
    const plantilla = randomFromArray(respuestasConDeudaPagar);
    const respuesta = plantilla.replace('${enlace}', enlacePago);
    
    return res.json({ 
      fulfillmentText: respuesta,
      outputContexts: [
        {
          name: `${session}/contexts/cliente_identificado`,
          lifespanCount: 4,
          parameters: { id_cliente: idCliente }
        }
      ]
    });
  }

  // PRIMERA VEZ: Preguntar método de pago
  const saldo = deudaReciente.saldo_pendiente.toFixed(2);
  const plantillaSeleccion = randomFromArray(respuestasSeleccionPasarela);
  const respuestaSeleccion = plantillaSeleccion.replace('${saldo}', saldo);

  return res.json({
    fulfillmentText: respuestaSeleccion,
    outputContexts: [
      {
        name: `${session}/contexts/cliente_identificado`,
        lifespanCount: 4,
        parameters: { id_cliente: idCliente }
      },
      {
        name: `${session}/contexts/seleccion_pago`,
        lifespanCount: 2,
        parameters: { id_deuda: deudaReciente.id_deuda }
      }
    ]
  });
}