import { Router, Request, Response } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { SessionsClient } from '@google-cloud/dialogflow';
import { twiml as TwilioTwiml } from 'twilio';

const router = Router();

router.post(
  '/messages',
  bodyParser.urlencoded({ extended: false }),
  async (req: Request, res: Response) => {
    try {
      const incomingText = req.body.Body  as string;
      const fromNumber   = req.body.From  as string;

      const keyFile = path.resolve(process.cwd(), process.env.GOOGLE_CREDENCIALES!);
      const client  = new SessionsClient({ keyFilename: keyFile });
      const projectId = await client.getProjectId(); 

      const sessionPath = client.projectAgentSessionPath(projectId, fromNumber);
      const [dfRes] = await client.detectIntent({
        session: sessionPath,
        queryInput: { text: { text: incomingText, languageCode: 'es' } },
      });

      const reply =
        dfRes.queryResult?.fulfillmentText ??
        'Lo siento, no entendí tu mensaje.';

      const twiml = new TwilioTwiml.MessagingResponse();
      twiml.message(reply);

      res.status(200).type('text/xml').send(twiml.toString());
    } catch (err) {
      console.error('/api/messages error:', err);
      res.status(500).send('Internal error');
    }
  }
);

export default router;
