import { Request, Response } from 'express';
import { prisma } from '../../db/client';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const respuestasSinDeudaMotivo: string[] = [
  "No tienes deudas pendientes, por lo que no hay motivos que mostrar.",
  "Tu cuenta está al día. No hay conceptos pendientes.",
  "No se encontraron deudas a tu nombre con motivos que consultar.",
  "Actualmente no tienes ninguna deuda con descripción pendiente.",
  "No hay motivos de deuda registrados en tu cuenta.",
  "Tu historial no muestra deudas con conceptos por pagar."
];

const respuestasConDeudaMotivo: string[] = [
  "El motivo de tu deuda es: ${motivo}",
  "Tu deuda corresponde a: ${motivo}",
  "El concepto de tu adeudo es: ${motivo}",
  "La descripción de tu deuda pendiente: ${motivo}",
  "Tu deuda se debe a: ${motivo}",
  "El motivo por el cual debes es: ${motivo}",
  "Concepto de la deuda: ${motivo}",
  "La razón de tu adeudo: ${motivo}"
];

export async function handleIntentMotivoDeuda(
  req: Request,
  res: Response
) {
  const contexts: any[] = req.body.queryResult?.outputContexts || [];
  const contextoIdentificado = contexts.find((c: any) =>
    c.name.endsWith('/contexts/cliente_identificado')
  );
  const session = req.body.session as string;

  const idCliente: string = contextoIdentificado?.parameters?.id_cliente;
  if (!idCliente) {
    return res.json({
      fulfillmentText:
        'Hubo un problema al identificarte. Por favor indícame tu correo o teléfono nuevamente.',
      outputContexts: [
        {
          name: `${session}/contexts/awaiting_identificacion`,
          lifespanCount: 2
        }
      ]
    });
  }

  const deudasCliente = await prisma.deuda.findMany({
    where: {
      id_cliente: idCliente,
      estado_deuda: {
        in: ["pendiente", "vencido"]
      },
      saldo_pendiente: {
        gt: 0 
      }
    }
  });

  if (!deudasCliente || deudasCliente.length === 0) {
    const textoAleatorio = randomFromArray(respuestasSinDeudaMotivo);
    return res.json({ 
      fulfillmentText: textoAleatorio,
      outputContexts: [
        {
          name: `${session}/contexts/cliente_identificado`,
          lifespanCount: 2,
          parameters: { id_cliente: idCliente }
        }
      ]
    });
  }

  const deudaReciente = deudasCliente.reduce((prev, curr) =>
    curr.fecha_vencimiento > prev.fecha_vencimiento ? curr : prev
  );
  const motivo = deudaReciente.descripcion || "Sin descripción especificada";
  const plantilla = randomFromArray(respuestasConDeudaMotivo);
  const respuesta = plantilla.replace('${motivo}', motivo);

  return res.json({ 
    fulfillmentText: respuesta,
    outputContexts: [
      {
        name: `${session}/contexts/cliente_identificado`,
        lifespanCount: 3,
        parameters: { id_cliente: idCliente }
      }
    ]
  });
}