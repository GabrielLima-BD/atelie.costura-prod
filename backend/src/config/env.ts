import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

const parsed = schema.parse(process.env);

export const env = parsed;

export function getRequiredEnv(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY' | 'SUPABASE_SERVICE_ROLE_KEY'): string {
  const value = env[name];
  if (!value) {
    const message = `Configuração inválida do ambiente. Variável ausente: ${name}`;
    console.error(message);
    throw new Error(message);
  }
  return value;
}
