import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'

interface AppError extends Error {
  statusCode?: number
  code?: string
  details?: unknown
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown'
  const timestamp = new Date().toISOString()

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
      requestId,
      timestamp,
    })
    return
  }

  if (err.name === 'UnauthorizedError' || err.statusCode === 401) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired authentication token',
      requestId,
      timestamp,
    })
    return
  }

  if (err.statusCode === 403) {
    res.status(403).json({
      error: 'Forbidden',
      message: err.message || 'Insufficient permissions',
      requestId,
      timestamp,
    })
    return
  }

  if (err.statusCode === 404) {
    res.status(404).json({
      error: 'Not found',
      message: err.message || 'Resource not found',
      requestId,
      timestamp,
    })
    return
  }

  if (err.statusCode === 429) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later',
      requestId,
      timestamp,
    })
    return
  }

  const isProduction = process.env.NODE_ENV === 'production'
  console.error(JSON.stringify({
    level: 'error',
    timestamp,
    requestId,
    method: req.method,
    path: req.path,
    error: err.message,
    stack: isProduction ? undefined : err.stack,
  }))

  res.status(err.statusCode || 500).json({
    error: 'Internal server error',
    message: isProduction ? 'An unexpected error occurred' : err.message,
    requestId,
    timestamp,
  })
}
