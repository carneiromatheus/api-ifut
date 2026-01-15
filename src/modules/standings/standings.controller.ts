import { Request, Response } from 'express';
import * as standingsService from './standings.service';
import { successResponse, errorResponse } from '../../utils/response';

export const getStandings = async (req: Request, res: Response) => {
  try {
    const campeonatoId = parseInt(req.params.id);
    const standings = await standingsService.getStandings(campeonatoId);
    return successResponse(res, { classificacao: standings });
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};
