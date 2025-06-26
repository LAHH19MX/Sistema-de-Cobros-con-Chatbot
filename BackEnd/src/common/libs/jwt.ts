import jwt from 'jsonwebtoken';

const SECRET = process.env.TOKEN_SECRET as string;

export function createAccessToken(payload: Record<string, any>): string {
  return jwt.sign(payload, SECRET, { expiresIn: '1d' });
}
