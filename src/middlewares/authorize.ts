import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { errorResponse } from '../utils/response';

export const authorize = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Usuário não autenticado', 401);
    }

    if (!roles.includes(req.user.tipo)) {
      return errorResponse(res, 'Acesso não autorizado', 403);
    }

    next();
  };
};
