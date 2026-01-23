import { Router } from 'express';
import * as playersController from './players.controller';
import * as statisticsController from '../statistics/statistics.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/', playersController.list);
router.get('/stats', playersController.listWithStats);
router.get('/:id', playersController.getById);
router.get('/:id/stats', statisticsController.getPlayerFullStats);
router.post('/', authenticate, playersController.create);
router.put('/:id', authenticate, playersController.update);
router.delete('/:id', authenticate, playersController.remove);

export default router;
