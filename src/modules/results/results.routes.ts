import { Router } from 'express';
import * as resultsController from './results.controller';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

const router = Router();

// Note: The actual endpoint PATCH /api/matches/:id/result is defined in matches routes
// This router is for any additional results-related endpoints

export default router;
