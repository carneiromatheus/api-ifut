import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../../utils/response';
import * as inscriptionsService from './inscriptions.service';
import { z } from 'zod';
import { StatusInscricao } from '@prisma/client';

const createInscriptionSchema = z.object({
  time_id: z.number().int().positive('ID do time inválido'),
});

const updateInscriptionSchema = z.object({
  status: z.enum(['pendente', 'aprovada', 'rejeitada'], {
    errorMap: () => ({ message: 'Status deve ser: pendente, aprovada ou rejeitada' }),
  }),
});

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Não autenticado', 401, 'UNAUTHORIZED');
    }

    const validation = createInscriptionSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMessage, 400, 'VALIDATION_ERROR');
    }

    const campeonatoId = parseInt(req.params.id as string);
    const inscription = await inscriptionsService.create(
      campeonatoId,
      validation.data.time_id,
      req.user.userId
    );

    return sendSuccess(res, inscription, 201);
  } catch (error) {
    next(error);
  }
};

export const findByCampeonato = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Não autenticado', 401, 'UNAUTHORIZED');
    }

    if (!req.user.organizadorId) {
      return sendError(res, 'Apenas organizadores podem ver inscrições', 403, 'FORBIDDEN');
    }

    const campeonatoId = parseInt(req.params.id as string);
    const status = req.query.status as StatusInscricao | undefined;

    const inscriptions = await inscriptionsService.findByCampeonato(
      campeonatoId,
      req.user.organizadorId,
      status
    );

    return sendSuccess(res, inscriptions, 200);
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return sendError(res, 'Não autenticado', 401, 'UNAUTHORIZED');
    }

    if (!req.user.organizadorId) {
      return sendError(res, 'Apenas organizadores podem atualizar inscrições', 403, 'FORBIDDEN');
    }

    const validation = updateInscriptionSchema.safeParse(req.body);

    if (!validation.success) {
      const errorMessage = validation.error.errors.map(e => e.message).join(', ');
      return sendError(res, errorMessage, 400, 'VALIDATION_ERROR');
    }

    const id = parseInt(req.params.id as string);
    const inscription = await inscriptionsService.update(
      id,
      req.user.organizadorId,
      validation.data.status
    );

    return sendSuccess(res, inscription, 200);
  } catch (error) {
    next(error);
  }
};

export default { create, findByCampeonato, update };
