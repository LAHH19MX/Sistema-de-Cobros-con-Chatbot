import { prisma } from '../../db/client';
import { sendEmail } from './ControlEmails';

export async function primerEmail(
  idInquilino: string,
  idCliente: string
): Promise<void> {
  const cfg = await prisma.configuracion.findFirst({
    where: { id_inquilino: idInquilino },
  });
  if (!cfg) throw new Error('Configuración de inquilino no encontrada');

  const cliente = await prisma.cliente.findUnique({
    where: { id_cliente: idCliente },
  });
  if (!cliente) throw new Error('Cliente no encontrado');
  
  const mensajeExtra = "\n\nPara consultar más información ingrese al WhatsApp a través de la siguiente URL: https://wa.me/123123123 o enviando un mensaje al número +52 123 123 123.";
  const mensajeFinal = cfg.mensaje_pre_vencimiento + mensajeExtra;

  await sendEmail(
    cliente.email_cliente,
    cfg.motivo,
    mensajeFinal
  );
  
  const ahora = new Date();
  await prisma.recordatorioEmail.create({
    data: {
      id_inquilino:     idInquilino,
      id_cliente:       idCliente,
      id_configuracion: cfg.id_configuracion,
      ultimo_email:     ahora,
      siguiente_email:  new Date(ahora.getTime() + cfg.frecuencia! * 3600_000),
    },
  });
}
