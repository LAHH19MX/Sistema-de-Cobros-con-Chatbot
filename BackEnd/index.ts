import * as dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';  
dotenv.config();                      

import express from 'express';
import webhookRouter  from './src/routes/webhook';   
import messagesRouter from './src/routes/messages';  
import webhookPayment from './src/routes/webhookStripe.routes'
import webhookPaypal from './src/routes/webhookPayPal.routes';

import authRouter from './src/modules/auth/routes/auth.routes'
import companyRouter from './src/modules/site/routes/company.routes'
import themesRouter from './src/modules/site/routes/dataThemes.routes'
import contentRouter from './src/modules/site/routes/dataContent.routes'
import tenantRouter from './src/modules/clients/routes/inquilino.routes'
import plansRouter from './src/modules/plans/routes/plans.routes'

const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie'] 
};

const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());

app.use('/webhook/stripe', webhookPayment);
app.use('/webhook/paypal', webhookPaypal); 
app.use('/api', webhookRouter);  
app.use('/api', messagesRouter);  
app.get('/paypal/success', (req, res) => {
  res.send('Pago completado');
});
app.get('/paypal/cancel', (req, res) => {
  res.send('Pago cancelado');
});

app.use('/api', authRouter);
app.use('/api', companyRouter);
app.use('/api', contentRouter);
app.use('/api', themesRouter);
app.use('/api', tenantRouter);
app.use('/api', plansRouter);


const PORT = process.env.PORT ?? 3000;

console.log('process.cwd() =', process.cwd());
app.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
);
