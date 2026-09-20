import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  BASE_SHORT_URL: z.string().url(),
  APP_ORIGIN: z.string().url(),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI is required')
    .refine((v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'), {
      message: 'MONGODB_URI must start with mongodb:// or mongodb+srv://',
    }),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  BCRYPT_COST: z.coerce.number().int().min(4).max(15).default(12),
  ANALYTICS_SALT_SECRET: z.string().min(16, 'ANALYTICS_SALT_SECRET must be at least 16 characters'),
  RATE_LIMIT_ENABLED: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables in your .env file:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
