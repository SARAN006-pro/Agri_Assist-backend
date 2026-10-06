import { describe, it, expect } from 'vitest'
import config from '../config'

describe('Configuration', () => {
  it('should have default server port', () => {
    expect(config.server.port).toBeDefined()
    expect(typeof config.server.port).toBe('number')
  })

  it('should have default JWT expiration', () => {
    expect(config.jwt.expiresIn).toBe('7d')
  })

  it('should have upload limits defined', () => {
    expect(config.upload.maxFileSize).toBeGreaterThan(0)
    expect(config.upload.allowedMimeTypes.length).toBeGreaterThan(0)
  })

  it('should have rate limiting defaults', () => {
    expect(config.rateLimit.windowMs).toBeGreaterThan(0)
    expect(config.rateLimit.maxRequests).toBeGreaterThan(0)
  })

  it('should have weather API key as optional', () => {
    expect(typeof config.weatherApi.key).toBe('string')
  })

  it('should have correct node environment', () => {
    expect(['development', 'production', 'test']).toContain(config.server.nodeEnv)
  })
})
