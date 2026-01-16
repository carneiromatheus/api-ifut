import { Request, Response } from 'express';
import * as championshipsService from './championships.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const list = async (req: Request, res: Response) => {
  try {
    const championships = await championshipsService.list();
    return successResponse(res, championships);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const listByUser = async (req: AuthRequest, res: Response) => {
  try {
    const userType = (req.user as any).tipo;
    let championships;
    
    // If organizer, return championships they organize
    if (userType === 'organizador' || userType === 'administrador') {
      championships = await championshipsService.listByUser(req.user!.userId);
    } else {
      // If coach, return championships their teams participate in
      championships = await championshipsService.listByParticipation(req.user!.userId);
    }
    
    return successResponse(res, championships);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const championship = await championshipsService.getById(parseInt(req.params.id));
    return successResponse(res, championship);
  } catch (error: any) {
    return errorResponse(res, error.message, 404);
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const championship = await championshipsService.create(req.body, req.user!.userId);
    return successResponse(res, championship, 201);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const championship = await championshipsService.update(
      parseInt(req.params.id),
      req.body,
      req.user!.userId
    );
    return successResponse(res, championship);
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    await championshipsService.remove(parseInt(req.params.id), req.user!.userId);
    return successResponse(res, { message: 'Campeonato removido com sucesso' });
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};
