import { Request, Response } from 'express';
import { prisma } from '../../../db/client';
import bcrypt from 'bcrypt';
import { sendEmail } from '../../../services/recordatorios/ControlEmails';

// Generar código de 6 dígitos
const generarCodigo = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Buscar email en ambas tablas
const buscarUsuario = async (email: string) => {
  // Buscar en tabla admin
  const admin = await prisma.admin.findUnique({
    where: { email_admin: email }
  });
  
  if (admin) {
    return { tipo: 'admin', usuario: admin };
  }

  // Buscar en tabla inquilinos
  const inquilino = await prisma.inquilino.findUnique({
    where: { email_inquilino: email }
  });

  if (inquilino) {
    return { tipo: 'inquilino', usuario: inquilino };
  }

  return null;
};

// Solicitar recuperación de contraseña (versión corregida)
export const solicitarRecuperacion = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Buscar usuario en ambas tablas
    const usuarioEncontrado = await buscarUsuario(email);

    // Si no se encontró el usuario, retornar error
    if (!usuarioEncontrado) {
      return res.status(400).json({ error: 'El email no está registrado' });
    }

    // Invalidar códigos anteriores no usados
    await prisma.codigo_recuperacion.updateMany({
      where: {
        email: email,
        usado: false
      },
      data: {
        usado: true
      }
    });

    // Generar nuevo código
    const codigo = generarCodigo();
    const fechaExpiracion = new Date(Date.now() + 60 * 1000); // 1 minuto

    // Guardar código en BD
    await prisma.codigo_recuperacion.create({
      data: {
        codigo,
        email,
        tipo_usuario: usuarioEncontrado.tipo,
        fecha_expiracion: fechaExpiracion
      }
    });

    // Enviar email
    const mensaje = `Tu código de recuperación es: ${codigo}\n\nEste código expirará en 1 minuto.`;
    await sendEmail(email, 'Código de Recuperación de Contraseña', mensaje);

    // Mensaje de éxito
    res.status(200).json({ message: 'Se ha enviado un código de recuperación a tu correo' });
  } catch (error) {
    console.error('Error en solicitar recuperación:', error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
};

// Validar código
export const validarCodigo = async (req: Request, res: Response) => {
  try {
    const { email, codigo } = req.body;

    // Buscar código válido
    const codigoRecuperacion = await prisma.codigo_recuperacion.findFirst({
      where: {
        email,
        codigo,
        usado: false,
        fecha_expiracion: {
          gt: new Date() // Mayor que la fecha actual
        }
      }
    });

    if (!codigoRecuperacion) {
      // Incrementar intentos si existe un código para este email
      await prisma.codigo_recuperacion.updateMany({
        where: {
          email,
          usado: false
        },
        data: {
          intentos: {
            increment: 1
          }
        }
      });

      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Verificar intentos
    if (codigoRecuperacion.intentos && codigoRecuperacion.intentos >= 3) {
      await prisma.codigo_recuperacion.update({
        where: { id: codigoRecuperacion.id },
        data: { usado: true }
      });
      return res.status(400).json({ error: 'Demasiados intentos fallidos' });
    }

    // Código válido
    res.status(200).json({ 
      message: 'Código válido',
      tipo_usuario: codigoRecuperacion.tipo_usuario
    });
  } catch (error) {
    console.error('Error al validar código:', error);
    res.status(500).json({ error: 'Error al validar el código' });
  }
};

// Reenviar código
export const reenviarCodigo = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Verificar que el usuario existe
    const usuarioEncontrado = await buscarUsuario(email);
    if (!usuarioEncontrado) {
      return res.status(400).json({ error: 'No se puede reenviar el código' });
    }

    // Invalidar códigos anteriores
    await prisma.codigo_recuperacion.updateMany({
      where: {
        email: email,
        usado: false
      },
      data: {
        usado: true
      }
    });

    // Generar nuevo código
    const codigo = generarCodigo();
    const fechaExpiracion = new Date(Date.now() + 60 * 1000); // 1 minuto

    // Guardar nuevo código
    await prisma.codigo_recuperacion.create({
      data: {
        codigo,
        email,
        tipo_usuario: usuarioEncontrado.tipo,
        fecha_expiracion: fechaExpiracion
      }
    });

    // Enviar email
    const mensaje = `Tu nuevo código de recuperación es: ${codigo}\n\nEste código expirará en 1 minuto.`;
    await sendEmail(email, 'Nuevo Código de Recuperación', mensaje);

    res.status(200).json({ message: 'Código reenviado exitosamente' });
  } catch (error) {
    console.error('Error al reenviar código:', error);
    res.status(500).json({ error: 'Error al reenviar el código' });
  }
};

// Restablecer contraseña
export const restablecerPassword = async (req: Request, res: Response) => {
  try {
    const { email, codigo, nuevaPassword } = req.body;

    // Validar que todos los campos estén presentes
    if (!email || !codigo || !nuevaPassword) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validar código
    const codigoRecuperacion = await prisma.codigo_recuperacion.findFirst({
      where: {
        email,
        codigo,
        usado: false,
        fecha_expiracion: {
          gt: new Date()
        }
      }
    });

    if (!codigoRecuperacion) {
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar contraseña según el tipo de usuario
    try {
      if (codigoRecuperacion.tipo_usuario === 'admin') {
        await prisma.admin.update({
          where: { 
            email_admin: email  // Usar el nombre de campo correcto
          },
          data: { password: hashedPassword }
        });
      } else {
        await prisma.inquilino.update({
          where: { 
            email_inquilino: email  // Usar el nombre de campo correcto
          },
          data: { password: hashedPassword }
        });
      }
    } catch (updateError) {
      console.error('Error al actualizar contraseña:', updateError);
      return res.status(400).json({ 
        error: 'No se pudo actualizar la contraseña. Verifica el email.' 
      });
    }

    // Marcar código como usado
    await prisma.codigo_recuperacion.update({
      where: { id: codigoRecuperacion.id },
      data: { usado: true }
    });

    res.status(200).json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error al restablecer la contraseña' });
  }
};