import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export const requestId = (req: Request, _res: Response, next: NextFunction): void => {
  const requestId = uuidv4()
  req.headers['x-request-id'] = requestId
  next()
}
