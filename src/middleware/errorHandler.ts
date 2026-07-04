import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

export class ResourceNotFoundException extends Error implements ApiError {
  statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'ResourceNotFoundException';
  }
}

export class ValidationException extends Error implements ApiError {
  statusCode = 400;

  constructor(message: string = 'Validation error') {
    super(message);
    this.name = 'ValidationException';
  }
}

export class UnauthorizedException extends Error implements ApiError {
  statusCode = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedException';
  }
}
