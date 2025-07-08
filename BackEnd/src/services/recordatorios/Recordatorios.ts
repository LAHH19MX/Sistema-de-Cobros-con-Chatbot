import pLimit from 'p-limit';
import { sendEmail } from './ControlEmails';
import { prisma } from '../../db/client';

export async function runRecordatorios() {
    const ahora = new Date();

    const pendientes = await prisma.recordatorioEmail.findMany({
        where: { siguiente_email: { lte: ahora } },
        take: 500,
        include: {
        Configuracion: true,
        Cliente: { include: { Deuda: true } }
        }
    });

    const limit = pLimit(5);
    
    await Promise.all(
        pendientes.map(r =>
            limit(async () => {
                const deuda = await prisma.deuda.findFirst({
                where: { id_cliente: r.id_cliente, estado_deuda: 'PENDIENTE' }
                });
                if (!deuda) {
                    await prisma.recordatorioEmail.delete({ where: { id_email: r.id_email } });
                    return;
                }

                const plantilla =
                ahora > deuda.fecha_vencimiento
                    ? r.Configuracion.mensaje_post_vencimiento
                    : r.Configuracion.mensaje_pre_vencimiento;

                await sendEmail(
                    r.Cliente.email_cliente,
                    r.Configuracion.motivo,
                    plantilla
                );

                const freq = Number(r.Configuracion.frecuencia);
                const next = new Date(ahora.getTime() + freq * 60 * 60 * 1000);
                await prisma.recordatorioEmail.update({
                    where: { id_email: r.id_email },
                    data: { 
                        ultimo_email: ahora, 
                        siguiente_email: next 
                    }
                });
            })
        )
    );
}