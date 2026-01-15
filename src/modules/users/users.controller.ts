import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import * as usersService from './users.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  nome: z.string().min(1).optional(),
  foto_url: z.string().url().optional(),
});

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Não autenticado', 401, 'UNAUTHORIZED');
    }

    const user = await usersService.getProfile(req.user.userId);
    return sendSuccess(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Não autenticado', 401, 'UNAUTHORIZED');
    }

    const validation = updateProfileSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMessage, 400, 'VALIDATION_ERROR');
    }

    const user = await usersService.updateProfile(req.user.userId, validation.data);
    return sendSuccess(res, user, 200);
  } catch (error) {
    next(error);
  }
};

export default { getProfile, updateProfile };
