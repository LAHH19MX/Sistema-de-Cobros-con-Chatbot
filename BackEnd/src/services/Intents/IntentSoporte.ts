import { Request, Response } from 'express';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

const opcionesSoporte: string[] = [
  'Puedes comunicarte con nosotros al número 7712345678 para atención personalizada.',
  'Para más ayuda, llama al 7712345678 o envía un correo a soporte@tuservicio.com.',
  'Nuestro horario de atención es de lunes a viernes de 9 a.m. a 6 p.m. al 7712345678.',
  'Si tienes dudas urgentes, también puedes escribirnos a soporte@tuservicio.com.',
  'Recuerda que puedes resolver muchas dudas aquí mismo. Para otros casos, llama al 7712345678.',
  '¿Tienes una consulta específica? Puedes llamar directamente al área de atención al 7712345678.',
  'Gracias por comunicarte. Para atención directa, marca al 7712345678.',
  'Puedes revisar nuestras preguntas frecuentes o llamarnos al 7712345678.',
  'Nuestro equipo responde consultas también por correo: soporte@tuservicio.com.',
  'Para otras gestiones, contáctanos en horario laboral al número 7712345678.',
  'Atendemos por llamada de lunes a viernes. Teléfono: 7712345678.',
  'Para soporte adicional, contáctanos vía correo electrónico: soporte@tuservicio.com.'
];

export function handleIntentSoporte(req: Request, res: Response) {
  const textoAleatorio: string = randomFromArray(opcionesSoporte);
  return res.json({ fulfillmentText: textoAleatorio });
}
