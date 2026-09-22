import { z } from 'zod';
import { expiresAt } from './urlSchemas.js';

export const createApiKeySchema = z.object({
  name: z.string().trim().min(1, 'Key name is required').max(60, 'Key name is too long'),
  expiresAt: expiresAt.nullish(),
});
