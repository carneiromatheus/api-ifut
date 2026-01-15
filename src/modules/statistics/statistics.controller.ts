import { Request, Response } from 'express';
import * as statisticsService from './statistics.service';
import { successResponse, errorResponse } from '../../utils/response';

export const getTopScorers = async (req: Request, res: Response) => {
  try {
    const campeonatoId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const topScorers = await statisticsService.getTopScorers(campeonatoId, limit);
    return successResponse(res, { artilheiros: topScorers });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const getPlayerStats = async (req: Request, res: Response) => {
  try {
    const jogadorId = parseInt(req.params.jogadorId);
    const campeonatoId = req.query.campeonatoId 
      ? parseInt(req.query.campeonatoId as string) 
      : undefined;
    
    const stats = await statisticsService.getPlayerStats(jogadorId, campeonatoId);
    return successResponse(res, stats);
  } catch (error: any) {
    return errorResponse(res, error.message, 404);
  }
};

/**
 * Get complete player statistics across all championships
 * GET /api/players/:id/stats
 */
export const getPlayerFullStats = async (req: Request, res: Response) => {
  try {
    const jogadorId = parseInt(req.params.id);
    
    if (isNaN(jogadorId)) {
      return errorResponse(res, 'ID do jogador inválido', 400);
    }
    
    const stats = await statisticsService.getPlayerFullStats(jogadorId);
    return successResponse(res, stats);
  } catch (error: any) {
    const message = error.message || 'Erro ao buscar estatísticas';
    const statusCode = message.includes('não encontrado') ? 404 : 400;
    return errorResponse(res, message, statusCode);
  }
};

/**
 * Get team match history
 * GET /api/teams/:id/history
 */
export const getTeamHistory = async (req: Request, res: Response) => {
  try {
    const timeId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    if (isNaN(timeId)) {
      return errorResponse(res, 'ID do time inválido', 400);
    }
    
    const history = await statisticsService.getTeamHistory(timeId, limit, offset);
    return successResponse(res, history);
  } catch (error: any) {
    const message = error.message || 'Erro ao buscar histórico';
    const statusCode = message.includes('não encontrado') ? 404 : 400;
    return errorResponse(res, message, statusCode);
  }
};

/**
 * Get head-to-head confrontation between two teams
 * GET /api/teams/:id/vs/:id2
 */
export const getHeadToHead = async (req: Request, res: Response) => {
  try {
    const timeId1 = parseInt(req.params.id);
    const timeId2 = parseInt(req.params.id2);
    
    if (isNaN(timeId1) || isNaN(timeId2)) {
      return errorResponse(res, 'IDs dos times inválidos', 400);
    }
    
    const confronto = await statisticsService.getHeadToHead(timeId1, timeId2);
    return successResponse(res, confronto);
  } catch (error: any) {
    const message = error.message || 'Erro ao buscar confronto';
    const statusCode = message.includes('não encontrado') ? 404 : 400;
    return errorResponse(res, message, statusCode);
  }
};
