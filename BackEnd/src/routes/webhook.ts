import { Router, Request, Response } from 'express';
import { handleIntentIdentificar } from '../services/Intents/IntentIdentificar'
import { handleIntentFechaLimit } from '../services/Intents/IntentFechaLimite'
import { handleIntentHorario } from '../services/Intents/IntentHorario'
import { handleIntentConsultarDeuda } from '../services/Intents/IntentConsutarDeuda'
import { handleIntentPagar } from '../services/Intents/IntentPagar'
import { handleIntentSoporte } from '../services/Intents/IntentSoporte'

const router = Router();

router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const intentName: string = req.body.queryResult?.intent?.displayName || '';
    const contexts: any[] = req.body.queryResult?.outputContexts || [];

    const hasContext = (ctxName: string): boolean => {
      return contexts.some((c: any) => c.name.endsWith(`/contexts/${ctxName}`));
    };

    if (hasContext('awaiting_identificacion')) {
      return handleIntentIdentificar(req, res);
    }

    if (['Consultar_Deuda', 'Fecha_Vencimiento', 'Pagar'].includes(intentName)) {
      const contextoIdentificado = contexts.find((c: any) =>
        c.name.endsWith('/contexts/cliente_identificado')
      );
      if (!contextoIdentificado) {
        return res.json({
          fulfillmentText:
            'Para continuar, por favor indícame tu correo o tu número de teléfono.',
          outputContexts: [
            {
              name: `${req.body.session}/contexts/awaiting_identificacion`,
              lifespanCount: 1
            }
          ]
        });
      }
      if (intentName === 'Consultar_Deuda') {
        return handleIntentConsultarDeuda(req, res);
      }
      if (intentName === 'Fecha_Vencimiento') {
        return handleIntentFechaLimit(req, res);
      }
      if (intentName === 'Pagar') {
        return handleIntentPagar(req, res);
      }
    }

    if (intentName === 'Horario_Atencion') {
      return handleIntentHorario(req, res);
    }
    if (intentName === 'Soporte_Humano') {
      return handleIntentSoporte(req, res);
    }

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
