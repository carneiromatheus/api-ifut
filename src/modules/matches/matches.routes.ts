import { Router } from 'express';
import * as matchesController from './matches.controller';
import * as resultsController from '../results/results.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// POST /api/matches - Create match (authenticated, organizer only)
router.post('/', authenticate, authorize(['organizador', 'administrador']), matchesController.create);

// GET /api/matches/:id - Get match details (public)
router.get('/:id', matchesController.getById);

// PATCH /api/matches/:id/result - Register match result (authenticated, organizer only)
router.patch('/:id/result', authenticate, authorize(['organizador', 'administrador']), resultsController.registerResult);

export default router;
