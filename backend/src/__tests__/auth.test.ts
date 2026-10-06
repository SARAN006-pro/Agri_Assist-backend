import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema } from '../modules/auth/auth.middleware'

describe('Auth validation schemas', () => {
  it('should validate a correct registration payload', () => {
    const result = registerSchema.parse({
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    })
    expect(result.email).toBe('test@example.com')
    expect(result.firstName).toBe('Test')
  })

  it('should reject an invalid email in registration', () => {
    expect(() =>
      registerSchema.parse({
        email: 'invalid-email',
        password: 'password123',
        firstName: 'Test',
      })
    ).toThrow()
  })

  it('should reject a short password in registration', () => {
    expect(() =>
      registerSchema.parse({
        email: 'test@example.com',
        password: '123',
        firstName: 'Test',
      })
    ).toThrow()
  })

  it('should validate a correct login payload', () => {
    const result = loginSchema.parse({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(result.email).toBe('test@example.com')
  })

  it('should reject login with missing password', () => {
    expect(() =>
      loginSchema.parse({
        email: 'test@example.com',
      })
    ).toThrow()
  })
})
