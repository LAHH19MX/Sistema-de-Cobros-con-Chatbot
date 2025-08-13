import { Request, Response } from 'express';
import { prisma } from '../../db/client';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const respuestasSinDeudaFecha: string[] = [
  "¡Bien! No tienes fechas de vencimiento pendientes.",
  "No hay deudas, por lo que no hay fechas de vencimiento que mostrar.",
  "Actualmente no tienes ningún pago vencido.",
  "No identificamos vencimientos activos, tu cuenta está al día.",
  "No existen fechas de vencimiento asociadas a tu cuenta.",
  "Tu historial no muestra deudas vencidas en este momento."
];

const respuestasConDeudaFecha: string[] = [
  "Tu próxima fecha de vencimiento es ${fecha}.",
  "La fecha límite para tu pago es el ${fecha}.",
  "Por favor, recuerda que debes saldar antes del ${fecha}.",
  "Tu vencimiento está programado para el ${fecha}.",
  "La deuda vencerá el ${fecha}.",
  "Agrega a tu calendario: tu deuda vence el ${fecha}.",
  "Recuerda tu fecha de pago: ${fecha}.",
  "El día de vencimiento de tu deuda es el ${fecha}."
];

export async function handleIntentFechaLimit(req: Request, res: Response) {
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
    const textoAleatorio = randomFromArray(respuestasSinDeudaFecha);
    return res.json({ fulfillmentText: textoAleatorio });
  }

  // Mantener lógica original: solo la deuda MÁS RECIENTE
  const deudaReciente = deudasCliente.reduce((prev, curr) =>
    curr.fecha_vencimiento > prev.fecha_vencimiento ? curr : prev
  );
  const fecha = deudaReciente.fecha_vencimiento.toLocaleDateString();
  const plantilla = randomFromArray(respuestasConDeudaFecha);
  const respuesta = plantilla.replace('${fecha}', fecha);

  return res.json({ fulfillmentText: respuesta });
}