import { Request, Response } from 'express';
import { prisma } from '../../db/client';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const saludosIdentificado: string[] = [
  "¡Hola ${nombre}! ¿En qué puedo ayudarte hoy?",
  "Saludos ${nombre}, estoy aquí para asistirte. ¿Qué necesitas?",
  "¡Qué gusto verte, ${nombre}! ¿Cómo puedo servirte?",
  "¡Bienvenido, ${nombre}! ¿En qué puedo apoyarte?",
  "Hola ${nombre}, dime cómo puedo ayudarte.",
  "Saludos, ${nombre}. ¿Necesitas información o ayuda?",
  "¡Hola ${nombre}! Estoy listo para atenderte.",
  "¡Muy buenas, ${nombre}! ¿Qué deseas consultar hoy?",
  "Hola ${nombre}, cuéntame cómo puedo asistirte.",
  "Saludos cordiales, ${nombre}. ¿En qué puedo servirte?",
  "¡Hola ${nombre}! Aquí para ayudarte en lo que necesites.",
  "¡Buenas, ${nombre}! ¿Qué necesitas hoy?"
];

export async function handleIntentIdentificar(req: Request, res: Response) {
  const parameters: any = req.body.queryResult?.parameters || {};
  const session = req.body.session as string;
  const email: string = parameters.email_cliente;
  const telefono: string = parameters.telefono_cliente;

  if (!email && !telefono) {
    return res.json({
      fulfillmentText:
        'No detecté un correo ni un teléfono. Por favor escríbelo nuevamente.',
      outputContexts: [
        {
          name: `${session}/contexts/awaiting_identificacion`,
          lifespanCount: 1
        }
      ]
    });
  }

  let clienteDB: { id_cliente: string; nombre_cliente: string } | null = null;
  if (email) {
    clienteDB = await prisma.cliente.findUnique({
      where: { email_cliente: email },
      select: { id_cliente: true, nombre_cliente: true }
    });
  }
  if (!clienteDB && telefono) {
    clienteDB = await prisma.cliente.findFirst({
      where: { telefono_cliente: telefono },
      select: { id_cliente: true, nombre_cliente: true }
    });
  }

  if (!clienteDB) {
    return res.json({
      fulfillmentText:
        'No encontré una cuenta con ese correo o teléfono. Intenta nuevamente.',
      outputContexts: [
        {
          name: `${session}/contexts/awaiting_identificacion`,
          lifespanCount: 1
        }
      ]
    });
  }

  const plantillaSaludo: string = randomFromArray(saludosIdentificado);
  const saludo = plantillaSaludo.replace('${nombre}', clienteDB.nombre_cliente);

  return res.json({
    fulfillmentText: saludo,
    outputContexts: [
      {
        name: `${session}/contexts/cliente_identificado`,
        lifespanCount: 5,
        parameters: { id_cliente: clienteDB.id_cliente }
      }
    ]
  });
}
