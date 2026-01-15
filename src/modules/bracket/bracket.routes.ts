import { Router } from 'express';
import { bracketController } from './bracket.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// Create bracket for a championship (requires organizer)
router.post(
  '/championships/:id/bracket',
  authenticate,
  authorize(['organizador', 'administrador']),
  bracketController.createBracket
);

// Get bracket (public)
router.get('/championships/:id/bracket', bracketController.getBracket);

// Advance winner to next phase (requires organizer)
router.post(
  '/matches/:id/advance',
  authenticate,
  authorize(['organizador', 'administrador']),
  bracketController.advanceWinner
);

export default router;
