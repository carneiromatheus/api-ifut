import { Request, Response } from 'express';
import * as teamsService from './teams.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const list = async (req: Request, res: Response) => {
  try {
    const teams = await teamsService.list();
    return successResponse(res, teams);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const team = await teamsService.getById(parseInt(req.params.id));
    return successResponse(res, team);
  } catch (error: any) {
    return errorResponse(res, error.message, 404);
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const team = await teamsService.create(req.body, req.user!.userId);
    return successResponse(res, team, 201);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const team = await teamsService.update(parseInt(req.params.id), req.body, req.user!.userId);
    return successResponse(res, team);
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    await teamsService.remove(parseInt(req.params.id), req.user!.userId);
    return successResponse(res, { message: 'Time removido com sucesso' });
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};
