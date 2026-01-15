import { Response } from 'express';
import { groupsService } from './groups.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const groupsController = {
  /**
   * Create groups for a misto championship
   * POST /api/championships/:id/groups
   */
  async createGroups(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const numGroups = parseInt(req.body.numGroups) || 2;

      if (!userId) {
        return errorResponse(res, 'Usuário não autenticado', 401);
      }

      if (isNaN(championshipId)) {
        return errorResponse(res, 'ID do campeonato inválido', 400);
      }

      if (numGroups < 2 || numGroups > 8) {
        return errorResponse(res, 'Número de grupos deve estar entre 2 e 8', 400);
      }

      const result = await groupsService.createGroups(championshipId, userId, numGroups);
      return successResponse(res, result, 201);
    } catch (error: any) {
      const message = error.message || 'Erro ao criar grupos';
      const statusCode = message.includes('não encontrado') ? 404 :
                         message.includes('Apenas o organizador') ? 403 : 400;
      return errorResponse(res, message, statusCode);
    }
  },

  /**
   * Get groups for a championship
   * GET /api/championships/:id/groups
   */
  async getGroups(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);

      if (isNaN(championshipId)) {
        return errorResponse(res, 'ID do campeonato inválido', 400);
      }

      const result = await groupsService.getGroups(championshipId);
      return successResponse(res, result);
    } catch (error: any) {
      const message = error.message || 'Erro ao buscar grupos';
      const statusCode = message.includes('não encontrado') ? 404 : 400;
      return errorResponse(res, message, statusCode);
    }
  },

  /**
   * Get standings for a specific group
   * GET /api/championships/:id/groups/:groupId/standings
   */
  async getGroupStandings(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);
      const groupId = parseInt(req.params.groupId);

      if (isNaN(championshipId) || isNaN(groupId)) {
        return errorResponse(res, 'IDs inválidos', 400);
      }

      const result = await groupsService.getGroupStandings(championshipId, groupId);
      return successResponse(res, result);
    } catch (error: any) {
      const message = error.message || 'Erro ao buscar classificação do grupo';
      const statusCode = message.includes('não encontrado') ? 404 : 400;
      return errorResponse(res, message, statusCode);
    }
  },

  /**
   * Create knockout phase from group qualifiers
   * POST /api/championships/:id/knockout-phase
   */
  async createKnockoutPhase(req: AuthRequest, res: Response) {
    try {
      const championshipId = parseInt(req.params.id);
      const userId = (req.user as any)?.id;
      const qualifiersPerGroup = parseInt(req.body.qualifiersPerGroup) || 2;

      if (!userId) {
        return errorResponse(res, 'Usuário não autenticado', 401);
      }

      if (isNaN(championshipId)) {
        return errorResponse(res, 'ID do campeonato inválido', 400);
      }

      if (qualifiersPerGroup < 1 || qualifiersPerGroup > 4) {
        return errorResponse(res, 'Número de classificados por grupo deve estar entre 1 e 4', 400);
      }

      const result = await groupsService.createKnockoutPhase(championshipId, userId, qualifiersPerGroup);
      return successResponse(res, result, 201);
    } catch (error: any) {
      const message = error.message || 'Erro ao criar fase mata-mata';
      const statusCode = message.includes('não encontrado') ? 404 :
                         message.includes('Apenas o organizador') ? 403 : 400;
      return errorResponse(res, message, statusCode);
    }
  },
};
