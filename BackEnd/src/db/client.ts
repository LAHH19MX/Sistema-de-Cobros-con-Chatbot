import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("Falta la variable DATABASE_URL en .env");
}

export const prisma = new PrismaClient();
