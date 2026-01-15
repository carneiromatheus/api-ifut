import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';

import authRoutes from './modules/auth/auth.routes';
import teamsRoutes from './modules/teams/teams.routes';
import playersRoutes from './modules/players/players.routes';
import championshipsRoutes from './modules/championships/championships.routes';
import registrationsRoutes from './modules/registrations/registrations.routes';
import matchesRoutes from './modules/matches/matches.routes';
import resultsRoutes from './modules/results/results.routes';
import standingsRoutes from './modules/standings/standings.routes';
import statisticsRoutes from './modules/statistics/statistics.routes';
import bracketRoutes from './modules/bracket/bracket.routes';
import groupsRoutes from './modules/groups/groups.routes';
import { authenticate } from './middlewares/authenticate';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api/doc', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/players', playersRoutes);
app.use('/api/championships', championshipsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/standings', standingsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api', bracketRoutes);
app.use('/api', groupsRoutes);

// Protected profile route
app.get('/api/auth/me', authenticate, (req, res, next) => {
  const authRoutes = require('./modules/auth/auth.controller');
  authRoutes.getProfile(req, res);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: 'Erro interno do servidor' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

export default app;
