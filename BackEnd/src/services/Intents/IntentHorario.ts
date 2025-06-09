// File: src/services/intents/IntentHorario.ts
import { Request, Response } from 'express';

const randomFromArray = (arr: string[]): string =>
  arr[Math.floor(Math.random() * arr.length)];

// Respuestas para Horario_Atencion (mínimo 12 opciones)
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

export function handleIntentHorario(req: Request, res: Response) {
  const textoAleatorio: string = randomFromArray(opcionesHorario);
  return res.json({ fulfillmentText: textoAleatorio });
}
