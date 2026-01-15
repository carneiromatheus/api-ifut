import { Router } from 'express';
import * as registrationsController from './registrations.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/championship/:campeonatoId', registrationsController.listByChampionship);
router.post('/', authenticate, registrationsController.create);
router.patch('/:id/approve', authenticate, registrationsController.approve);
router.patch('/:id/reject', authenticate, registrationsController.reject);

export default router;
