import { z } from 'zod';

const FIVE_YEARS_MS = 5 * 365 * 24 * 60 * 60 * 1000;

// An empty text box means "nothing was entered".
const emptyToUndefined = (value) => (value === '' ? undefined : value);

export const expiresAt = z.iso
  .datetime({
    offset: true,
    message: 'Expiry must be a valid date and time, like 2027-01-01T00:00:00Z',
  })
  .transform((text) => new Date(text))
  .refine((date) => date > new Date(), 'Expiry must be in the future')
  .refine((date) => date < new Date(Date.now() + FIVE_YEARS_MS), 'Expiry must be within 5 years');

export const tag = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]{1,24}$/, 'Tags use letters, numbers and - only (up to 24 characters)');

// Only the fields listed here are accepted. Anything else (like ownerId, clickCount or status)
// is thrown away, so a user cannot set them by sneaking them into the request.
export const createUrlSchema = z.object({
  originalUrl: z.string().trim().min(1, 'Destination URL is required'),
  customAlias: z.string().trim().transform(emptyToUndefined).optional(),
  title: z
    .string()
    .trim()
    .max(100, 'Title is too long (maximum 100 characters)')
    .transform(emptyToUndefined)
    .optional(),
  expiresAt: expiresAt.nullish(),
  tags: z.array(tag).max(10, 'You can add up to 10 tags').optional(),
});