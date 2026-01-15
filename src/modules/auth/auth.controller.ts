import { Request, Response } from 'express';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const register = async (req: Request, res: Response) => {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, result, 201);
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, result);
  } catch (error: any) {
    return errorResponse(res, error.message, 401);
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return errorResponse(res, 'Usuário não autenticado', 401);
    }
    const user = await authService.getProfile(req.user.userId);
    return successResponse(res, user);
  } catch (error: any) {
    return errorResponse(res, error.message, 400);
  }
};
