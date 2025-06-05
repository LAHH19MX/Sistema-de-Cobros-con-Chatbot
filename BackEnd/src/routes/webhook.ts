// src/routes/webhook.ts
import { Router } from 'express';
import { prisma } from '../db/client';

const router = Router();

// Función auxiliar para seleccionar un elemento aleatorio de un array
const randomFromArray = (arr: string[]): string => arr[Math.floor(Math.random() * arr.length)];

// Arrays de respuestas para diferentes escenarios
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
  "¡Buenos días/tardes/noches, ${nombre}! ¿Qué necesitas hoy?"
];

router.post('/webhook', async (req, res) => {
  try {
    const intentName: string = req.body.queryResult?.intent?.displayName || '';
    const parameters: any = req.body.queryResult?.parameters || {};
    const contexts: any[] = req.body.queryResult?.outputContexts || [];

    const hasContext = (ctxName: string): boolean => {
      return contexts.some((c: any) => c.name.endsWith(`/contexts/${ctxName}`));
    };

    // Manejo para Consultar_Deuda, Fecha_Vencimiento, Pagar
    if (["Consultar_Deuda", "Fecha_Vencimiento", "Pagar"].includes(intentName)) {
      // Verificar si existe el contexto 'cliente_identificado'
      const contextoIdentificado: any = contexts.find((c: any) => c.name.endsWith('/contexts/cliente_identificado'));
      if (!contextoIdentificado) {
        // No identificado, pedimos correo o teléfono
        return res.json({
          fulfillmentText: 'Para continuar, por favor indícame tu correo o tu número de teléfono.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 1
            }
          ]
        });
      }

      // Ya está identificado, extraemos el ID de cliente  
      const idCliente: string = contextoIdentificado.parameters?.id_cliente;
      if (!idCliente) {
        return res.json({
          fulfillmentText: 'Hubo un problema al identificarte. Por favor indícame tu correo o teléfono nuevamente.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 1
            }
          ]
        });
      }

      // Función auxiliar para obtener deudas asociadas al cliente
      const obtenerDeudas = async (): Promise<any[]> => {
        return await prisma.deudas.findMany({
          where: { id_cliente: idCliente }
        });
      };

      if (intentName === 'Consultar_Deuda') {
        const deudasCliente: any[] = await obtenerDeudas();
        if (!deudasCliente || deudasCliente.length === 0) {
          const textoAleatorio: string = randomFromArray(respuestasSinDeudaConsultar);
          return res.json({ fulfillmentText: textoAleatorio });
        }
        // Tomar la deuda más reciente (por fecha_vencimiento mayor)
        const deudaReciente: any = deudasCliente.reduce((prev: any, curr: any) => {
          const fechaPrev: Date = prev.fecha_vencimiento;
          const fechaCurr: Date = curr.fecha_vencimiento;
          return fechaCurr > fechaPrev ? curr : prev;
        });
        const saldo: string = deudaReciente.saldo_pendiente.toFixed(2);
        // Elegir respuesta aleatoria e inyectar el saldo
        const plantilla: string = randomFromArray(respuestasConDeudaConsultar);
        const respuesta: string = plantilla.replace('${saldo}', saldo);
        return res.json({ fulfillmentText: respuesta });
      }

      if (intentName === 'Fecha_Vencimiento') {
        const deudasCliente: any[] = await obtenerDeudas();
        if (!deudasCliente || deudasCliente.length === 0) {
          const textoAleatorio: string = randomFromArray(respuestasSinDeudaFecha);
          return res.json({ fulfillmentText: textoAleatorio });
        }
        const deudaReciente: any = deudasCliente.reduce((prev: any, curr: any) => {
          const fechaPrev: Date = prev.fecha_vencimiento;
          const fechaCurr: Date = curr.fecha_vencimiento;
          return fechaCurr > fechaPrev ? curr : prev;
        });
        const fecha: string = deudaReciente.fecha_vencimiento.toLocaleDateString();
        const plantilla: string = randomFromArray(respuestasConDeudaFecha);
        const respuesta: string = plantilla.replace('${fecha}', fecha);
        return res.json({ fulfillmentText: respuesta });
      }

      if (intentName === 'Pagar') {
        const deudasCliente: any[] = await obtenerDeudas();
        if (!deudasCliente || deudasCliente.length === 0) {
          const textoAleatorio: string = randomFromArray(respuestasSinDeudaPagar);
          return res.json({ fulfillmentText: textoAleatorio });
        }
        const deudaReciente: any = deudasCliente.reduce((prev: any, curr: any) => {
          const fechaPrev: Date = prev.fecha_vencimiento;
          const fechaCurr: Date = curr.fecha_vencimiento;
          return fechaCurr > fechaPrev ? curr : prev;
        });
        // Generar enlace de pago usando lógica real o ejemplo simplificado
        const enlacePago: string = `https://tu-pasarela.com/pago?cliente=${idCliente}&deuda=${deudaReciente.id_deuda}`;
        const plantilla: string = randomFromArray(respuestasConDeudaPagar);
        const respuesta: string = plantilla.replace('${enlace}', enlacePago);
        return res.json({ fulfillmentText: respuesta });
      }
    }

    // Manejar identificación en contexto 'awaiting_identificacion'
    if (hasContext('awaiting_identificacion')) {
      const email: string = parameters.email_cliente as string;
      const telefono: string = parameters.telefono_cliente as string;
      if (!email && !telefono) {
        return res.json({
          fulfillmentText: 'No detecté un correo ni un teléfono. Por favor escríbelo nuevamente.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 1
            }
          ]
        });
      }

      // Buscar cliente por correo o teléfono
      let clienteDB: any = null;
      if (email) {
        clienteDB = await prisma.clientes.findUnique({
          where: { email_cliente: email },
          select: { id_cliente: true, nombre_cliente: true }
        });
      }
      if (!clienteDB && telefono) {
        clienteDB = await prisma.clientes.findFirst({
          where: { telefono_cliente: telefono },
          select: { id_cliente: true, nombre_cliente: true }
        });
      }

      if (!clienteDB) {
        return res.json({
          fulfillmentText: 'No encontré una cuenta con ese correo o teléfono. Intenta nuevamente.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 1
            }
          ]
        });
      }

      // Generar saludo aleatorio para cliente identificado
      const plantillaSaludo: string = randomFromArray(saludosIdentificado);
      const saludo: string = plantillaSaludo.replace('${nombre}', clienteDB.nombre_cliente);

      return res.json({
        fulfillmentText: saludo,
        outputContexts: [
          {
            name: `${req.body.session}/contexts/cliente_identificado`,
            lifespanCount: 5,
            parameters: { id_cliente: clienteDB.id_cliente }
          }
        ]
      });
    }

    // Intents dinámicos sin contexto: Horario_Atencion y Soporte_Humano
    if (intentName === 'Horario_Atencion') {
      // Array de respuestas posibles para Horario_Atencion
      const opcionesHorario: string[] = [
        'Nuestro horario de atención es de Lunes a Viernes, 9:00 a 18:00.',
        'Atendemos de 9 AM a 6 PM de Lunes a Viernes.',
        'Puedes contactarnos de Lunes a Viernes entre 9:00 y 18:00.',
        'Nuestro equipo está disponible de 9:00 a 18:00, de Lunes a Viernes.',
        'Horario de servicio: Lunes a Viernes, 9:00 – 18:00 horas.',
        'Estamos operando de Lunes a Viernes de 9 AM a 6 PM.',
        'Atención al cliente: Lunes a Viernes, 9:00 a 18:00.',
        'Ofrecemos soporte de Lunes a Viernes, de 9 AM a 6 PM.',
        'Disponibles de Lunes a Viernes, 9:00 – 18:00.',
        'Horario laboral: Lunes a Viernes de 9:00 a 18:00.',
        'Nuestra oficina abre de Lunes a Viernes entre 9 y 18 horas.',
        'Puedes comunicarte en horario de oficina: Lunes a Viernes, 9 – 18 hrs.'
      ];
      const textoAleatorio: string = randomFromArray(opcionesHorario);
      return res.json({ fulfillmentText: textoAleatorio });
    }

    if (intentName === 'Soporte_Humano') {
      const opcionesSoporte: string[] = [
        'Un agente te contactará en breve. Gracias por tu paciencia.',
        'Estoy conectando con un representante; espera un momento por favor.',
        'Solicitando atención humana. En breve un agente responderá.',
        'Nuestro equipo de soporte se comunicará contigo pronto.',
        'Un operador tomará tu solicitud. Por favor, aguarda.',
        'Se ha notificado al personal de soporte. Recibirás respuesta pronto.',
        'Tu solicitud de soporte ha sido enviada. Estate atento.',
        'Contactando a un agente de soporte. Un momento, por favor.',
        'Hemos asignado tu caso a un representante. Te atenderá enseguida.',
        'Atención humana solicitada. Pronto alguien te atenderá.',
        'Tu caso está en proceso. Un agente te responderá pronto.',
        'Soporte humano en camino. Gracias por esperar.'
      ];
      const textoAleatorio: string = randomFromArray(opcionesSoporte);
      return res.json({ fulfillmentText: textoAleatorio });
    }

    // Fallback si no coincide ningún intent
    return res.json({
      fulfillmentText: 'Lo siento, no entendí tu solicitud. ¿Podrías reformularla, por favor?'
    });
  } catch (err) {
    console.error('Error en webhook:', err);
    return res.json({
      fulfillmentText: 'Ocurrió un error interno. Por favor intenta de nuevo más tarde.'
    });
  }
});

export default router;
