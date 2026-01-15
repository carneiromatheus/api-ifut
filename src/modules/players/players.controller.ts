import { Request, Response } from 'express';
import * as playersService from './players.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const list = async (req: Request, res: Response) => {
  try {
    const { timeId } = req.query;
    const players = await playersService.list(timeId ? parseInt(timeId as string) : undefined);
    return successResponse(res, players);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const player = await playersService.getById(parseInt(req.params.id));
    return successResponse(res, player);
  } catch (error: any) {
    return errorResponse(res, error.message, 404);
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const player = await playersService.create(req.body, req.user!.userId);
    return successResponse(res, player, 201);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const player = await playersService.update(parseInt(req.params.id), req.body, req.user!.userId);
    return successResponse(res, player);
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};

export const remove = async (req: AuthRequest, res: Response) => {
  try {
    await playersService.remove(parseInt(req.params.id), req.user!.userId);
    return successResponse(res, { message: 'Jogador removido com sucesso' });
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};
