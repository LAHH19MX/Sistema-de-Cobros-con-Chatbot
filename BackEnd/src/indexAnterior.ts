import { Pool } from 'pg';
import bcrypt from 'bcrypt';

// Configuración para Railway (usa tu URL directamente)
const pool = new Pool({
  connectionString: "postgresql://postgres:LuPuDuFyyRnJYFKaurXfBkfdcvXbWmmL@turntable.proxy.rlwy.net:26465/railway",
  ssl: {
    rejectUnauthorized: false // Necesario para Railway/Render
  }
});

// Datos del admin (modifícalos según necesites)
const adminData = {
  nombre: 'Angel',
  apellido_paterno: 'Hernandez',
  apellido_materno: 'Hernandez',
  email: 'luisangelhernandez02605@gmail.com',
  telefono: '7713314285',
  direccion: 'Huejutla de Reyes',
  password: 'Zoo!2153pt', // ¡Cambia esta contraseña!
  id_empresa: '7c4fe9f1-b602-46c5-8ac3-2021cfe7245d'
};

async function registrarAdmin() {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

  try {
    const query = `
      INSERT INTO admin (
        nombre_admin,
        apellido_paterno_admin,
        apellido_materno_admin,
        email_admin,
        telefono_admin,
        direccion_admin,
        password,
        id_empresa
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;
    
    const values = [
      adminData.nombre,
      adminData.apellido_paterno,
      adminData.apellido_materno,
      adminData.email,
      adminData.telefono,
      adminData.direccion,
      hashedPassword,
      adminData.id_empresa
    ];

    const res = await pool.query(query, values);
    console.log('✅ Admin registrado:', res.rows[0]);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error:', error.message);
    } else {
      console.error('❌ Error desconocido:', error);
    }
  } finally {
    await pool.end();
  }
}

registrarAdmin();