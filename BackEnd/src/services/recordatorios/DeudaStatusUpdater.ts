import { prisma } from '../../db/client';

export async function actualizarDeudasVencidas() {
  try {
    const ahora = new Date();
    console.log(`🔍 Verificando deudas vencidas a las: ${ahora.toISOString()}`);
    
    const deudasParaVencer = await prisma.deuda.findMany({
      where: {
        estado_deuda: 'pendiente',
        fecha_vencimiento: { lt: ahora },
        saldo_pendiente: { gt: 0 } 
      },
      select: {
        id_deuda: true,
        fecha_vencimiento: true,
        saldo_pendiente: true
      }
    });

    // LUEGO: Actualizar
    const deudasVencidas = await prisma.deuda.updateMany({
      where: {
        estado_deuda: 'pendiente',
        fecha_vencimiento: { lt: ahora },
        saldo_pendiente: { gt: 0 } 
      },
      data: { estado_deuda: 'vencido' }
    });

    
    return deudasVencidas.count;
  } catch (error) {
    throw error;
  }
}