import { Router, Request, Response } from 'express';
import { handleIntentIdentificar } from '../services/Intents/IntentIdentificar'
import { handleIntentFechaLimit } from '../services/Intents/IntentFechaLimite'
import { handleIntentHorario } from '../services/Intents/IntentHorario'
import { handleIntentConsultarDeuda } from '../services/Intents/IntentConsutarDeuda'
import { handleIntentPagar } from '../services/Intents/IntentPagar'
import { handleIntentSoporte } from '../services/Intents/IntentSoporte'
import { canUseResource, incrementResourceUsage } from '../modules/subscriptions/controller/resourceUtils'
import { handleIntentMotivoDeuda } from '../services/Intents/IntentMotivoDeuda';

import { prisma } from '../db/client'

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const intentName: string = req.body.queryResult?.intent?.displayName || '';
    const contexts: any[] = req.body.queryResult?.outputContexts || [];

    const hasContext = (ctxName: string): boolean => {
      return contexts.some((c: any) => c.name.endsWith(`/contexts/${ctxName}`));
    };

    // Manejo de autenticación - NO consume recursos
    if (hasContext('awaiting_identificacion')) {
      return handleIntentIdentificar(req, res);
    }

    // Intents que requieren autenticación
    if (['Consultar_Deuda', 'Fecha_Vencimiento', 'Pagar', 'Seleccionar_Metodo_Pago', 'Motivo_Deuda'].includes(intentName)) {
      const contextoIdentificado = contexts.find((c: any) =>
        c.name.endsWith('/contexts/cliente_identificado')
      );
      
      // Si no está identificado, pedir autenticación
      if (!contextoIdentificado) {
        return res.json({
          fulfillmentText:
            'Para continuar, por favor indícame tu correo o tu número de teléfono.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 3
            }
          ]
        });
      }

      // SOLO REGISTRAR RECURSOS EN BACKGROUND - NO VERIFICAR, NO ESPERAR
      const idCliente = contextoIdentificado.parameters?.id_cliente;
      
      // Disparar y olvidar - NO AWAIT
      prisma.cliente.findUnique({
        where: { id_cliente: idCliente },
        select: { id_inquilino: true }
      })
      .then(cliente => {
        if (cliente) {
          // Solo intentar incrementar, sin verificar
          incrementResourceUsage(cliente.id_inquilino, 'whatsapp').catch(() => {});
        }
      })
      .catch(() => {}); // Ignorar errores silenciosamente

      if (intentName === 'Consultar_Deuda') {
        return handleIntentConsultarDeuda(req, res);
      }
      if (intentName === 'Fecha_Vencimiento') {
        return handleIntentFechaLimit(req, res);
      }
      if (intentName === 'Motivo_Deuda') {
        return handleIntentMotivoDeuda(req, res);
      }
      if (intentName === 'Pagar') {
        return handleIntentPagar(req, res);
      }
      if (intentName === 'Seleccionar_Metodo_Pago') {
        return handleIntentPagar(req, res);
      }
    }

    // Intents que NO requieren autenticación
    if (intentName === 'Horario_Atencion') {
      return handleIntentHorario(req, res);
    }
    if (intentName === 'Soporte_Humano') {
      return handleIntentSoporte(req, res);
    }

    // Respuesta por defecto
    return res.json({
      fulfillmentText:
        'Lo siento, no entendí tu solicitud. ¿Podrías reformularla, por favor?'
    });
    
  } catch (err) {
    console.error('Error en webhook:', err);
    return res.json({
      fulfillmentText:
        'Ocurrió un error interno. Por favor intenta de nuevo más tarde.'
    });
  }
});

export default router;