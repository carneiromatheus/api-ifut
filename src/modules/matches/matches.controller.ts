import { Request, Response } from 'express';
import * as matchesService from './matches.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';
import { StatusPartida } from '@prisma/client';

export const list = async (req: Request, res: Response) => {
  try {
    const { championshipId, status, rodada } = req.query;
    
    if (championshipId) {
      const filters: any = {};
      if (status) filters.status = status as StatusPartida;
      if (rodada) filters.rodada = parseInt(rodada as string);
      
      const matches = await matchesService.listByChampionship(parseInt(championshipId as string), filters);
      return successResponse(res, matches);
    }
    
    return errorResponse(res, 'championshipId is required', 400);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const match = await matchesService.createMatch(req.body, req.user!.userId);
    return successResponse(res, match, 201);
  } catch (error: any) {
    const statusCode = error.message.includes('Apenas o organizador') ? 403 : 400;
    return errorResponse(res, error.message, statusCode);
  }
};

export const listByChampionship = async (req: Request, res: Response) => {
  try {
    const campeonatoId = parseInt(req.params.id);
    const { status, rodada } = req.query;
    
    const filters: any = {};
    if (status) filters.status = status as StatusPartida;
    if (rodada) filters.rodada = parseInt(rodada as string);

    const matches = await matchesService.listByChampionship(campeonatoId, filters);
    return successResponse(res, matches);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const getById = async (req: Request, res: Response) => {
  try {
    const match = await matchesService.getById(parseInt(req.params.id));
    return successResponse(res, match);
  } catch (error: any) {
    return errorResponse(res, error.message, 404);
  }
};

export const update = async (req: AuthRequest, res: Response) => {
  try {
    const match = await matchesService.updateMatch(
      parseInt(req.params.id),
      req.body,
      req.user!.userId
    );
    return successResponse(res, match);
  } catch (error: any) {
    const statusCode = error.message.includes('Apenas o organizador') ? 403 : 400;
    return errorResponse(res, error.message, statusCode);
  }
};
