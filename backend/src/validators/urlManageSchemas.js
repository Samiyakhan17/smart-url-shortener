import { z } from 'zod';
import { expiresAt, tag } from './urlSchemas.js';

// GET /urls?page=2&limit=10
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// PATCH /urls/:id  -  send only the fields you want to change.
// "strict" means any other field (like customAlias or shortCode) is rejected with a clear error,
// because the short code and alias can never be changed after a link is created.
export const updateUrlSchema = z
  .strictObject({
    originalUrl: z.string().trim().min(1, 'Destination URL is required').optional(),
    title: z
      .string()
      .trim()
      .max(100, 'Title is too long (maximum 100 characters)')
      .transform((value) => (value === '' ? null : value))
      .nullable()
      .optional(),
    expiresAt: expiresAt.nullable().optional(), // null = remove the expiry date
    status: z.enum(['active', 'disabled']).optional(),
    tags: z.array(tag).max(10, 'You can add up to 10 tags').optional(),
    isFavorite: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: 'Send at least one field to change',
  });