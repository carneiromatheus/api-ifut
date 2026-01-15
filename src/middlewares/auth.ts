import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../config/jwt';
import { sendError } from '../utils/response';
import prisma from '../config/database';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { organizadorId?: number };
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Token não fornecido', 401, 'NO_TOKEN');
      return;
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = { ...decoded };
    next();
  } catch (error) {
    sendError(res, 'Token inválido', 401, 'INVALID_TOKEN');
    return;
  }
};

export const organizerOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.tipo !== 'organizador') {
    sendError(res, 'Acesso permitido apenas para organizadores', 403, 'FORBIDDEN');
    return;
  }
  next();
};

export default { authMiddleware, organizerOnly };
