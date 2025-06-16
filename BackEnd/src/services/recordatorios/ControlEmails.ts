import sg from '@sendgrid/mail';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.SENDGRID_KEY) {
  console.error(' No se encontró la variable SENDGRID_KEY');
  process.exit(1);
}

sg.setApiKey(process.env.SENDGRID_KEY);
export async function sendEmail(destinatario: string, titulo: string, mensaje: string) {
  const msg = {
    to: destinatario,
    from: process.env.MAIL_FROM!, 
    subject: titulo,
    text: mensaje,
    trackingSettings: {
      openTracking:        { enable: false },
      clickTracking:       { enable: false, enableText: false },
      subscriptionTracking:{ enable: false },
      googleAnalytics:     { enable: false },
    }
  };

  try {
    const [response] = await sg.send(msg);
    console.log(` Correo enviado a ${destinatario}, statusCode: ${response.statusCode}`);
  } catch (err: any) {
    console.error(' Error al enviar correo:', err.response?.body || err.message);
  }
}
