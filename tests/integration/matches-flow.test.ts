import request from 'supertest';
import app from '../../src/app';
import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  prisma 
} from '../helpers/testUtils';

describe('Matches Flow Integration Tests', () => {
  let organizer: any;
  let organizerToken: string;
  let championship: any;
  let teamA: any;
  let teamB: any;

  beforeEach(async () => {
    // Clean database
    await prisma.$executeRawUnsafe('TRUNCATE TABLE partidas CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE classificacoes CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE inscricoes CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE times CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE campeonatos CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE usuarios CASCADE');

    // Create test data
    const orgResult = await createTestUser({ tipo: 'organizador', email: 'org@test.com' });
    organizer = orgResult.user;
    organizerToken = orgResult.token;

    championship = await createTestChampionship(organizer.id, {
      nome: 'Campeonato Teste',
      dataInicio: new Date('2025-01-01')
    });

    teamA = await createTestTeam(organizer.id, { nome: 'Time A' });
    teamB = await createTestTeam(organizer.id, { nome: 'Time B' });

    await createApprovedRegistration(championship.id, teamA.id);
    await createApprovedRegistration(championship.id, teamB.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complete Match Flow', () => {
    it('should create match -> list matches -> get match details', async () => {
      // Step 1: Create match
      const createResponse = await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          campeonatoId: championship.id,
          timeCasaId: teamA.id,
          timeVisitanteId: teamB.id,
          rodada: 1,
          dataHora: '2025-02-01T15:00:00Z',
          local: 'Estádio Municipal'
        });

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.success).toBe(true);
      const matchId = createResponse.body.data.id;

      // Step 2: List matches
      const listResponse = await request(app)
        .get(`/api/championships/${championship.id}/matches`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);

      // Step 3: Get match details
      const detailsResponse = await request(app)
        .get(`/api/matches/${matchId}`);

      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.data.id).toBe(matchId);
      expect(detailsResponse.body.data.timeCasa).toBeDefined();
      expect(detailsResponse.body.data.timeVisitante).toBeDefined();
    });

    it('should filter matches by rodada', async () => {
      // Create matches in different rounds
      await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          campeonatoId: championship.id,
          timeCasaId: teamA.id,
          timeVisitanteId: teamB.id,
          rodada: 1,
          dataHora: '2025-02-01T15:00:00Z'
        });

      await request(app)
        .post('/api/matches')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          campeonatoId: championship.id,
          timeCasaId: teamB.id,
          timeVisitanteId: teamA.id,
          rodada: 2,
          dataHora: '2025-02-08T15:00:00Z'
        });

      // Filter by round 1
      const response = await request(app)
        .get(`/api/championships/${championship.id}/matches?rodada=1`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].rodada).toBe(1);
    });
  });
});
