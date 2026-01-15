import { Request, Response } from 'express';
import * as registrationsService from './registrations.service';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/authenticate';

export const listByChampionship = async (req: Request, res: Response) => {
  try {
    const registrations = await registrationsService.listByChampionship(
      parseInt(req.params.campeonatoId)
    );
    return successResponse(res, registrations);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const create = async (req: AuthRequest, res: Response) => {
  try {
    const registration = await registrationsService.create(req.body, req.user!.userId);
    return successResponse(res, registration, 201);
  } catch (error: any) {
    return errorResponse(res, error.message);
  }
};

export const approve = async (req: AuthRequest, res: Response) => {
  try {
    const registration = await registrationsService.approve(
      parseInt(req.params.id),
      req.user!.userId
    );
    return successResponse(res, registration);
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};

export const reject = async (req: AuthRequest, res: Response) => {
  try {
    const registration = await registrationsService.reject(
      parseInt(req.params.id),
      req.body.motivo,
      req.user!.userId
    );
    return successResponse(res, registration);
  } catch (error: any) {
    return errorResponse(res, error.message, 403);
  }
};
