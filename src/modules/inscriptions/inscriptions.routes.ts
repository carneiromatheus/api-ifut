import { Router } from 'express';
import * as inscriptionsController from './inscriptions.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// PATCH /api/inscriptions/:id - Aprovar/rejeitar (organizador dono)
router.patch('/:id', authMiddleware, inscriptionsController.update);

export default router;
