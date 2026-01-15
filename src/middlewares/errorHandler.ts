import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.code);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    if (prismaError.code === 'P2002') {
      return sendError(res, 'Registro duplicado', 400, 'DUPLICATE_ENTRY');
    }
    if (prismaError.code === 'P2025') {
      return sendError(res, 'Registro não encontrado', 404, 'NOT_FOUND');
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Token inválido', 401, 'INVALID_TOKEN');
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expirado', 401, 'TOKEN_EXPIRED');
  }

  // Default error
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message,
    500,
    'INTERNAL_ERROR'
  );
};

export default errorHandler;
