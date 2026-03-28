import { z } from 'zod';

const envSchema = z.object({
  // Node
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Banco de dados
  DATABASE_URL: z.string().url('DATABASE_URL deve ser uma URL válida de conexão PostgreSQL'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL deve ser uma URL válida de conexão Redis'),

  // Google Gemini
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY é obrigatório'),

  // Meta / Instagram
  META_APP_ID: z.string().min(1, 'META_APP_ID é obrigatório'),
  META_APP_SECRET: z.string().min(1, 'META_APP_SECRET é obrigatório'),
  META_WEBHOOK_VERIFY_TOKEN: z.string().min(8, 'META_WEBHOOK_VERIFY_TOKEN deve ter ao menos 8 caracteres'),
  META_WEBHOOK_SECRET: z.string().min(1, 'META_WEBHOOK_SECRET é obrigatório'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET deve ter ao menos 32 caracteres'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET deve ter ao menos 32 caracteres'),

  // Autenticação admin
  ADMIN_USERNAME: z.string().min(3, 'ADMIN_USERNAME deve ter ao menos 3 caracteres'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD deve ter ao menos 8 caracteres (hash bcrypt)'),

  // Criptografia de tokens (AES-256 = 32 bytes = 64 hex chars)
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .length(64, 'TOKEN_ENCRYPTION_KEY deve ter exatamente 64 caracteres hex (32 bytes)')
    .regex(/^[0-9a-fA-F]+$/, 'TOKEN_ENCRYPTION_KEY deve ser uma string hexadecimal válida'),

  // Link Tracker
  TRACKER_BASE_URL: z.string().url('TRACKER_BASE_URL deve ser uma URL válida'),

  // Frontend
  FRONTEND_URL: z.string().url('FRONTEND_URL deve ser uma URL válida'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.errors
      .map((err) => `  • ${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `Variáveis de ambiente inválidas ou ausentes:\n${formatted}\n\nVerifique o arquivo .env.example`,
    );
  }

  return result.data;
}

// Exporta as variáveis validadas — falha na inicialização se alguma estiver ausente
export const env = validateEnv();
