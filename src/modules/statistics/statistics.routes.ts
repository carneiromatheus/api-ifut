import { Router } from 'express';
import * as statisticsController from './statistics.controller';

const router = Router();

// GET /api/statistics/player/:jogadorId - Get player statistics
router.get('/player/:jogadorId', statisticsController.getPlayerStats);

export default router;
