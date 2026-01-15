import { Router } from 'express';
import * as usersController from './users.controller';
import { authMiddleware } from '../../middlewares/auth';

const router = Router();

// GET /api/users/me - Perfil do usuário autenticado
router.get('/me', authMiddleware, usersController.getProfile);

// PATCH /api/users/me - Editar perfil
router.patch('/me', authMiddleware, usersController.updateProfile);

export default router;
