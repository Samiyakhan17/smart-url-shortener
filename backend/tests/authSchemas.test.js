import { registerSchema, loginSchema } from '../src/validators/authSchemas.js';

describe('registerSchema', () => {
  it('accepts valid input and cleans it up', () => {
    const result = registerSchema.parse({
      name: '  Sam  ',
      email: '  SAM@Example.com ',
      password: 'abcd1234',
    });
    expect(result).toEqual({ name: 'Sam', email: 'sam@example.com', password: 'abcd1234' });
  });

  it('rejects a bad email', () => {
    const r = registerSchema.safeParse({ name: 'Sam', email: 'not-an-email', password: 'abcd1234' });
    expect(r.success).toBe(false);
  });

  it('rejects weak passwords', () => {
    const base = { name: 'Sam', email: 'sam@example.com' };
    expect(registerSchema.safeParse({ ...base, password: 'short1' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: 'onlyletters' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, password: '12345678' }).success).toBe(false);
  });

  it('ignores extra fields such as role', () => {
    const result = registerSchema.parse({
      name: 'Sam',
      email: 'sam@example.com',
      password: 'abcd1234',
      role: 'admin',
    });
    expect(result.role).toBeUndefined();
  });
});

describe('loginSchema', () => {
  it('accepts an email and a password', () => {
    expect(loginSchema.safeParse({ email: 'sam@example.com', password: 'x' }).success).toBe(true);
  });

  it('rejects a missing password', () => {
    expect(loginSchema.safeParse({ email: 'sam@example.com' }).success).toBe(false);
  });
});