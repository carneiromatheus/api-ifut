import { Router } from 'express';
import * as teamsController from './teams.controller';
import * as statisticsController from '../statistics/statistics.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

router.get('/', teamsController.list);
router.get('/:id', teamsController.getById);
router.get('/:id/history', statisticsController.getTeamHistory);
router.get('/:id/vs/:id2', statisticsController.getHeadToHead);
router.post('/', authenticate, authorize(['organizador', 'tecnico', 'administrador']), teamsController.create);
router.put('/:id', authenticate, teamsController.update);
router.delete('/:id', authenticate, teamsController.remove);

export default router;
