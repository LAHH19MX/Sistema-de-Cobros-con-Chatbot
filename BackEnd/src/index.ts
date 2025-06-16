import * as dotenv from 'dotenv';
dotenv.config();                      

import express from 'express';
import webhookRouter  from './routes/webhook';   
import messagesRouter from './routes/messages';  
import webhookPayment from './routes/webhookPayments.routes'

const app = express();
app.use(express.json());

app.use('/webhook/stripe', webhookPayment);
app.use('/api', webhookRouter);  
app.use('/api', messagesRouter);         

const PORT = process.env.PORT ?? 3000;

console.log('process.cwd() =', process.cwd());
app.listen(PORT, () =>
  console.log(`Server corriendo en http://localhost:${PORT}`)
);
