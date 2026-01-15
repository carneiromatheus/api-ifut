import { Response } from 'express';
import * as resultsService from './results.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const registerResult = async (req: AuthRequest, res: Response) => {
  try {
    const matchId = parseInt(req.params.id);
    const result = await resultsService.registerResult(matchId, req.body, req.user!.userId);
    return successResponse(res, result);
  } catch (error: any) {
    const statusCode = error.message.includes('Apenas o organizador') ? 403 : 400;
    return errorResponse(res, error.message, statusCode);
  }
};
