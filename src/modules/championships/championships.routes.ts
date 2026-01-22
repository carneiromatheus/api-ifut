import { Router } from 'express';
import * as championshipsController from './championships.controller';
import * as matchesController from '../matches/matches.controller';
import * as standingsController from '../standings/standings.controller';
import * as statisticsController from '../statistics/statistics.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.get('/', championshipsController.list);
router.get('/my', authenticate, championshipsController.listByUser);
router.get('/:id', championshipsController.getById);
router.post('/', authenticate, authorize(['organizador', 'administrador']), championshipsController.create);
router.put('/:id', authenticate, championshipsController.update);
router.post('/:id/start', authenticate, championshipsController.start);
router.patch('/:id/toggle-registrations', authenticate, championshipsController.toggleRegistrations);
router.delete('/:id', authenticate, championshipsController.remove);

// GET /api/championships/:id/matches - List matches (public)
router.get('/:id/matches', matchesController.listByChampionship);

// GET /api/championships/:id/standings - Get standings (public)
router.get('/:id/standings', standingsController.getStandings);

// GET /api/championships/:id/top-scorers - Get top scorers (public)
router.get('/:id/top-scorers', statisticsController.getTopScorers);

export default router;
