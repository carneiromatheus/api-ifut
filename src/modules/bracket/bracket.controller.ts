import { Response } from 'express';
import { bracketService } from './bracket.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const bracketController = {
  /**
   * Create bracket for a mata-mata championship
   * POST /api/championships/:id/bracket
   */
  async createBracket(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;

      if (!userId) {
        return errorResponse(res, 'Usuário não autenticado', 401);
      }

      if (isNaN(championshipId)) {
        return errorResponse(res, 'ID do campeonato inválido', 400);
      }

      const result = await bracketService.createBracket(championshipId, userId);
      return successResponse(res, result, 201);
    } catch (error: any) {
      const message = error.message || 'Erro ao criar chaveamento';
      const statusCode = message.includes('não encontrado') ? 404 : 
                         message.includes('Apenas o organizador') ? 403 : 400;
      return errorResponse(res, message, statusCode);
    }
  },

  /**
   * Get bracket for a championship
   * GET /api/championships/:id/bracket
   */
  async getBracket(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);

      if (isNaN(championshipId)) {
        return errorResponse(res, 'ID do campeonato inválido', 400);
      }

      const result = await bracketService.getBracket(championshipId);
      return successResponse(res, result);
    } catch (error: any) {
      const message = error.message || 'Erro ao buscar chaveamento';
      const statusCode = message.includes('não encontrado') ? 404 : 400;
      return errorResponse(res, message, statusCode);
    }
  },

  /**
   * Advance winner to next phase after match result
   * POST /api/matches/:id/advance
   */
  async advanceWinner(req: AuthRequest, res: Response) {
    try {
      const matchId = parseInt(req.params.id);

      if (isNaN(matchId)) {
        return errorResponse(res, 'ID da partida inválido', 400);
      }

      const result = await bracketService.advanceWinner(matchId);
      return successResponse(res, result);
    } catch (error: any) {
      const message = error.message || 'Erro ao avançar vencedor';
      const statusCode = message.includes('não encontrada') ? 404 : 400;
      return errorResponse(res, message, statusCode);
    }
  },
};
