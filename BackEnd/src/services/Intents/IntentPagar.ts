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
  "Tienes una deuda de $${saldo}. ¿Con qué método prefieres pagar?(Dame una de las siguientes respuestas exactas)\n\n1._ Quiero pagar con stripe \n2._ Quiero pagar con paypal'",
  "Tu saldo pendiente es de $${saldo}. Selecciona tu método de pago(Dame una de las siguientes respuestas exactas):\n\n 1._ Quiero pagar con stripe \n 2._ Quiero pagar con paypal\n\n'",
  "Debes $${saldo}. ¿Cómo quieres pagar?(Dame una de las siguientes respuestas exactas)\n\n• 1._ Quiero pagar con stripe\n• 2._ Quiero pagar con paypal\n\nEscribe tu preferencia"
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
  const parameters = req.body.queryResult?.parameters || {};
  const intentName = req.body.queryResult?.intent?.displayName || '';

  // Logs para debug
  console.log('Intent recibido:', intentName);
  console.log('Parámetros:', parameters);
  console.log('Mensaje del usuario:', userMessage);
  console.log('Contexto selección pago:', contextoSeleccionPago?.parameters);

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

  // CAMBIO: Incluir tanto deudas "pendientes" como "vencidas"
  const deudasCliente = await prisma.deuda.findMany({
    where: {
      id_cliente: idCliente,
      estado_deuda: {
        in: ["pendiente", "vencido"]
      },
      saldo_pendiente: {
        gt: 0  // Solo deudas con saldo pendiente mayor a 0
      }
    }
  });

  if (!deudasCliente || deudasCliente.length === 0) {
    const textoAleatorio = randomFromArray(respuestasSinDeudaPagar);
    return res.json({ fulfillmentText: textoAleatorio });
  }

  // Mantener lógica original: solo la deuda MÁS RECIENTE
  const deudaReciente = deudasCliente.reduce((prev, curr) =>
    curr.fecha_vencimiento > prev.fecha_vencimiento ? curr : prev
  );

  // Detección mejorada del método de pago
  let metodoElegido: string | null = null;

  // 1. Primero verificar si viene del intent Seleccionar_Metodo_Pago
  if (intentName === 'Seleccionar_Metodo_Pago' && parameters.metodospago) {
    metodoElegido = parameters.metodospago.toLowerCase();
    console.log('Método detectado desde intent Seleccionar_Metodo_Pago:', metodoElegido);
  }
  // 2. Verificar si ya hay una pasarela elegida en el contexto
  else if (contextoSeleccionPago?.parameters?.pasarela_elegida) {
    metodoElegido = contextoSeleccionPago.parameters.pasarela_elegida;
    console.log('Método detectado desde contexto:', metodoElegido);
  }
  // 3. Detectar por regex en el mensaje (para el intent Pagar)
  else if (intentName === 'Pagar') {
    if (/(stripe|tarjeta|credito|d[ée]bito|visa|mastercard|1\b)/i.test(userMessage)) {
      metodoElegido = 'stripe';
      console.log('Método detectado por regex: stripe');
    } else if (/(paypal|pay\s?pal|pp|2\b)/i.test(userMessage)) {
      metodoElegido = 'paypal';
      console.log('Método detectado por regex: paypal');
    }
  }

  // Si se detectó un método, generar el enlace
  if (metodoElegido && (metodoElegido === 'stripe' || metodoElegido === 'paypal')) {
    let enlacePago: string;
    try {
      if (metodoElegido === 'stripe') {
        enlacePago = await createStripeLink(deudaReciente.id_deuda);
      } else {
        enlacePago = await createPaypalLink(deudaReciente.id_deuda);
      }

      const plantilla = randomFromArray(respuestasConDeudaPagar);
      const respuesta = plantilla.replace('${enlace}', enlacePago);
      
      return res.json({ 
        fulfillmentText: respuesta,
        outputContexts: [
          {
            name: `${session}/contexts/cliente_identificado`,
            lifespanCount: 2,
            parameters: { id_cliente: idCliente }
          }
        ]
      });
    } catch (err) {
      console.error(`Error creando enlace ${metodoElegido}:`, err);
      return res.json({
        fulfillmentText: `Lo siento, hubo un problema generando tu enlace de pago con ${metodoElegido}. Por favor intenta más tarde.`
      });
    }
  }
  // Si no se detectó método y es el intent Pagar, preguntar
  else if (intentName === 'Pagar') {
    const saldo = deudaReciente.saldo_pendiente.toFixed(2);
    const plantillaSeleccion = randomFromArray(respuestasSeleccionPasarela);
    const respuestaSeleccion = plantillaSeleccion.replace('${saldo}', saldo);

    return res.json({
      fulfillmentText: respuestaSeleccion,
      outputContexts: [
        {
          name: `${session}/contexts/cliente_identificado`,
          lifespanCount: 2,
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
  // Si es Seleccionar_Metodo_Pago pero no se detectó el método
  else {
    return res.json({
      fulfillmentText: 'Por favor selecciona un método de pago válido: Stripe o PayPal.',
      outputContexts: [
        {
          name: `${session}/contexts/cliente_identificado`,
          lifespanCount: 2,
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
}