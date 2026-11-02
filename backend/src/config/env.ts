import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  const missing = parsed.error.issues
    .filter((issue) => issue.code === 'invalid_type' && issue.received === 'undefined')
    .map((issue) => issue.path.join('.'));
  const details = missing.length > 0
    ? `Variáveis ausentes: ${missing.join(', ')}`
    : parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Configuração inválida do ambiente. ${details}`);
}

export const env = parsed.data;
