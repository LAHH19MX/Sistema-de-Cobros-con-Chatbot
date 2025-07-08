// File: src/services/intents/IntentConsultarDeuda.ts
import { Request, Response } from 'express';
import { prisma } from '../../db/client';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const respuestasSinDeudaConsultar: string[] = [
  "¡Excelente! No tienes deudas pendientes en este momento.",
  "No se encontraron deudas a tu nombre. ¡Buen trabajo!",
  "Tu cuenta está al día. No hay deudas registradas.",
  "Por ahora, no tienes pagos pendientes. ¡Disfruta tu día!",
  "No identificamos ninguna deuda para ti. ¡Felicidades!",
  "Tus registros muestran que no hay deuda asociada a ti."
];

const respuestasConDeudaConsultar: string[] = [
  "Tu saldo pendiente es de $${saldo}.",
  "Actualmente debes $${saldo}.",
  "Tienes un adeudo de $${saldo}, por favor revisa tus movimientos.",
  "Se encontró una deuda de $${saldo} a tu nombre.",
  "Tu deuda pendiente asciende a $${saldo}.",
  "El monto que debes es $${saldo}.",
  "Hay un saldo pendiente de $${saldo}.",
  "Por el momento, tu adeudo es $${saldo}."
];

export async function handleIntentConsultarDeuda(
  req: Request,
  res: Response
) {
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
    const textoAleatorio = randomFromArray(respuestasSinDeudaConsultar);
    return res.json({ fulfillmentText: textoAleatorio });
  }

  const deudaReciente = deudasCliente.reduce((prev, curr) =>
    curr.fecha_vencimiento > prev.fecha_vencimiento ? curr : prev
  );
  const saldo = deudaReciente.saldo_pendiente.toFixed(2);
  const plantilla = randomFromArray(respuestasConDeudaConsultar);
  const respuesta = plantilla.replace('${saldo}', saldo);

  return res.json({ fulfillmentText: respuesta });
}
