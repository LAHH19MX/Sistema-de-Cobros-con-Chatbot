import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';  
import { createServer } from 'http';  
dotenv.config();                      

import express from 'express';
import { initializeSocket } from './src/common/config/socket';  
import webhookRouter  from './src/routes/webhook';   
import messagesRouter from './src/routes/messages';  
import webhookPayment from './src/routes/webhookStripe.routes'
import webhookPaypal from './src/routes/webhookPayPal.routes';
import { capturePaypalOrder } from './src/services/payment/paypal';

import authRouter from './src/modules/auth/routes/auth.routes'
import recuperacionRouter from './src/modules/auth/routes/recuperacion.routes'
import companyRouter from './src/modules/site/routes/company.routes'
import themesRouter from './src/modules/site/routes/dataThemes.routes'
import contentRouter from './src/modules/site/routes/dataContent.routes'
import tenantRouter from './src/modules/inquilinos/routes/inquilino.routes'
import plansRouter from './src/modules/plans/routes/plans.routes'

//Suscripciones
import subscriptionRoutes from './src/modules/subscriptions/routes/subscription.routes';
import webhookRoutes from './src/modules/webhooks/routes/webhook.routes';

//Para tenant
import dashboardRoutes from './src/modules/payment-links/routes/dashboard.routes';
import clientesRoutes from './src/modules/clientes/routes/clientes.routes'
import clientesMorososRoutes from './src/modules/clientes/routes/morosos.routes'
import deudasRoutes from './src/modules/deudas/routes/deudas.routes'
import ingresosRoutes from './src/modules/ingresos/routes/ingresos.routes'
import perfilRoutes from './src/modules/settings/routes/perfil.routes'
import configuracionRoutes from './src/modules/settings/routes/configuracion.routes'
import pasarelasRoutes from './src/modules/settings/routes/pasarelas.routes'

import './src/services/recordatorios/ServicioCron'

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'] 
};

const app = express();
const server = createServer(app);

app.use(cookieParser());
app.use(cors(corsOptions));

initializeSocket(server);

app.use('/webhook/stripe', webhookPayment); 
app.use('/webhook/paypal', webhookPaypal); 
app.use('/api/webhooks', webhookRoutes);   

app.use(express.json());

app.use('/api', webhookRouter);  
app.use('/api', messagesRouter);  

app.get('/paypal/success', async (req, res) => {
  const token = req.query.token as string;
  
  if (!token) {
    return res.send('Error: No se recibió token de PayPal');
  }

  // Capturar el pago
  const capturado = await capturePaypalOrder(token);
  
  if (capturado) {
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>✅ Pago Completado</h1>
          <p>Tu pago ha sido procesado exitosamente.</p>
          <p>Puedes cerrar esta ventana.</p>
        </body>
      </html>
    `);
  } else {
    res.send(`
      <html>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⏳ Procesando Pago</h1>
          <p>Estamos verificando tu pago, por favor espera...</p>
        </body>
      </html>
    `);
  }
});

app.get('/paypal/cancel', (req, res) => {
  res.send(`
    <html>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>❌ Pago Cancelado</h1>
        <p>Has cancelado el proceso de pago.</p>
        <p>Puedes cerrar esta ventana.</p>
      </body>
    </html>
  `);
});

app.use('/api', authRouter);
app.use('/api', recuperacionRouter);
app.use('/api', companyRouter);
app.use('/api', contentRouter);
app.use('/api', themesRouter);
app.use('/api', tenantRouter);
app.use('/api', plansRouter);

//rutas para tenants
app.use('/api/tenant/dashboard', dashboardRoutes)
app.use('/api/tenant', clientesRoutes)
app.use('/api/tenant', clientesMorososRoutes)
app.use('/api/tenant', deudasRoutes)
app.use('/api/tenant', ingresosRoutes)
app.use('/api/tenant/settings', perfilRoutes)
app.use('/api/tenant/settings', configuracionRoutes)
app.use('/api/tenant/settings', pasarelasRoutes)

app.use('/api/subscriptions', subscriptionRoutes);

const PORT = process.env.PORT ?? 3000;

console.log('process.cwd() =', process.cwd());

// CAMBIO: Usar server.listen en lugar de app.listen
server.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
);