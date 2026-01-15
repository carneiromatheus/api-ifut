import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';
import { 
  createTestUser, 
  createTestTeam, 
  createTestPlayer, 
  createTestChampionship,
  createTestInscription,
  createTeamWithPlayers 
} from '../../tests/helpers';

describe('Inscriptions Module', () => {
  let userToken: string;
  let userId: number;
  let teamId: number;
  let championshipId: number;
  let organizerToken: string;
  let organizerId: number;

  beforeEach(async () => {
    // Create organizer
    const { token: orgToken, organizador } = await createTestUser({
      email: 'organizador@email.com',
      tipo: 'organizador',
    });
    organizerToken = orgToken;
    organizerId = organizador!.id;

    // Create championship
    const championship = await createTestChampionship(organizerId, { status: 'aberto' });
    championshipId = championship.id;

    // Create regular user with team that has 7+ players
    const { user, token } = await createTestUser({ email: 'user@email.com' });
    userToken = token;
    userId = user.id;

    const { team } = await createTeamWithPlayers(userId, 7);
    teamId = team.id;
  });

  describe('POST /api/championships/:id/inscriptions', () => {
    it('deve inscrever time com sucesso', async () => {
      const response = await request(app)
        .post(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ time_id: teamId });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('pendente');
      expect(response.body.data.time_id).toBe(teamId);
      expect(response.body.data.campeonato_id).toBe(championshipId);
    });

    it('deve retornar erro se time tem < 7 jogadores', async () => {
      // Create team with only 5 players
      const smallTeam = await createTestTeam(userId, { nome: 'Time Pequeno' });
      for (let i = 0; i < 5; i++) {
        await createTestPlayer(smallTeam.id, { numero_camisa: i + 1 });
      }

      const response = await request(app)
        .post(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ time_id: smallTeam.id });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('mínimo 7 jogadores');
    });

    it('deve retornar erro se time já inscrito', async () => {
      // First inscription
      await request(app)
        .post(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ time_id: teamId });

      // Try to inscribe again
      const response = await request(app)
        .post(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ time_id: teamId });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('já inscrito');
    });

    it('deve retornar erro se não for criador do time', async () => {
      const { token: anotherToken } = await createTestUser({ email: 'outro@email.com' });

      const response = await request(app)
        .post(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ time_id: teamId });

      expect(response.status).toBe(403);
    });

    it('deve retornar erro se campeonato não está aberto', async () => {
      // Create championship with status em_andamento
      const closedChamp = await createTestChampionship(organizerId, { status: 'em_andamento' });

      const response = await request(app)
        .post(`/api/championships/${closedChamp.id}/inscriptions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ time_id: teamId });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('não está aberto');
    });
  });

  describe('GET /api/championships/:id/inscriptions', () => {
    it('deve listar inscrições se for organizador dono', async () => {
      // Create inscriptions
      await createTestInscription(championshipId, teamId);

      const { user: user2 } = await createTestUser({ email: 'user2@email.com' });
      const { team: team2 } = await createTeamWithPlayers(user2.id, 7);
      await createTestInscription(championshipId, team2.id);

      const response = await request(app)
        .get(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('deve filtrar por status', async () => {
      await createTestInscription(championshipId, teamId, { status: 'pendente' });

      const { user: user2 } = await createTestUser({ email: 'user3@email.com' });
      const { team: team2 } = await createTeamWithPlayers(user2.id, 7);
      await createTestInscription(championshipId, team2.id, { status: 'aprovada' });

      const response = await request(app)
        .get(`/api/championships/${championshipId}/inscriptions?status=pendente`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].status).toBe('pendente');
    });

    it('deve retornar erro se não for organizador dono', async () => {
      // Create another organizer
      const { token: anotherOrgToken } = await createTestUser({
        email: 'outro_org@email.com',
        tipo: 'organizador',
      });

      const response = await request(app)
        .get(`/api/championships/${championshipId}/inscriptions`)
        .set('Authorization', `Bearer ${anotherOrgToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/inscriptions/:id', () => {
    it('deve aprovar inscrição se for organizador dono', async () => {
      const inscription = await createTestInscription(championshipId, teamId, { status: 'pendente' });

      const response = await request(app)
        .patch(`/api/inscriptions/${inscription.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'aprovada' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('aprovada');
    });

    it('deve rejeitar inscrição se for organizador dono', async () => {
      const inscription = await createTestInscription(championshipId, teamId, { status: 'pendente' });

      const response = await request(app)
        .patch(`/api/inscriptions/${inscription.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'rejeitada' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('rejeitada');
    });

    it('deve retornar erro se não for organizador dono', async () => {
      const { token: anotherOrgToken } = await createTestUser({
        email: 'outro_org2@email.com',
        tipo: 'organizador',
      });
      const inscription = await createTestInscription(championshipId, teamId);

      const response = await request(app)
        .patch(`/api/inscriptions/${inscription.id}`)
        .set('Authorization', `Bearer ${anotherOrgToken}`)
        .send({ status: 'aprovada' });

      expect(response.status).toBe(403);
    });

    it('deve retornar erro se status inválido', async () => {
      const inscription = await createTestInscription(championshipId, teamId);

      const response = await request(app)
        .patch(`/api/inscriptions/${inscription.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ status: 'invalido' });

      expect(response.status).toBe(400);
    });
  });
});
