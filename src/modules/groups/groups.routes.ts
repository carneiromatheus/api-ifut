import { Router } from 'express';
import { groupsController } from './groups.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// Create groups for a championship (requires organizer)
router.post(
  '/championships/:id/groups',
  authenticate,
  authorize(['organizador', 'administrador']),
  groupsController.createGroups
);

// Get groups (public)
router.get('/championships/:id/groups', groupsController.getGroups);

// Get group standings (public)
router.get('/championships/:id/groups/:groupId/standings', groupsController.getGroupStandings);

// Create knockout phase from group qualifiers (requires organizer)
router.post(
  '/championships/:id/knockout-phase',
  authenticate,
  authorize(['organizador', 'administrador']),
  groupsController.createKnockoutPhase
);

export default router;
