import request from 'supertest';
import app from '../../app';
import { createTestUser, createTestTeam, createTestPlayer } from '../../tests/helpers';

describe('Teams Module', () => {
  let authToken: string;
  let userId: number;

  beforeEach(async () => {
    const { user, token } = await createTestUser();
    authToken = token;
    userId = user.id;
  });

  describe('POST /api/teams', () => {
    it('deve criar time com sucesso', async () => {
      const teamData = {
        nome: 'Flamengo FC',
        ano_fundacao: 2010,
        cores: ['vermelho', 'preto'],
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send(teamData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(teamData.nome);
      expect(response.body.data.criador_id).toBe(userId);
    });

    it('deve retornar erro se não autenticado', async () => {
      const response = await request(app)
        .post('/api/teams')
        .send({ nome: 'Flamengo FC' });

      expect(response.status).toBe(401);
    });

    it('deve retornar erro se nome vazio', async () => {
      const response = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: '' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/teams', () => {
    it('deve listar times (público)', async () => {
      // Create teams
      await createTestTeam(userId, { nome: 'Time 1' });
      await createTestTeam(userId, { nome: 'Time 2' });
      await createTestTeam(userId, { nome: 'Time 3' });

      const response = await request(app).get('/api/teams');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);
    });

    it('deve filtrar times por nome (search)', async () => {
      await createTestTeam(userId, { nome: 'Flamengo FC' });
      await createTestTeam(userId, { nome: 'Corinthians FC' });

      const response = await request(app).get('/api/teams?search=Flamengo');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].nome).toBe('Flamengo FC');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('deve retornar detalhes do time', async () => {
      const team = await createTestTeam(userId, { nome: 'Meu Time' });
      await createTestPlayer(team.id, { nome: 'Jogador 1' });
      await createTestPlayer(team.id, { nome: 'Jogador 2' });

      const response = await request(app).get(`/api/teams/${team.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe('Meu Time');
      expect(response.body.data.jogadores.length).toBe(2);
    });

    it('deve retornar erro se time não existe', async () => {
      const response = await request(app).get('/api/teams/99999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/teams/:id', () => {
    it('deve editar time se for o criador', async () => {
      const team = await createTestTeam(userId);

      const response = await request(app)
        .patch(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.nome).toBe('Nome Atualizado');
    });

    it('deve retornar erro se não for o criador', async () => {
      // Create team with different user
      const { user: anotherUser } = await createTestUser({ email: 'outro@email.com' });
      const team = await createTestTeam(anotherUser.id);

      const response = await request(app)
        .patch(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('deve excluir time se for o criador', async () => {
      const team = await createTestTeam(userId);

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('deve retornar erro se não for o criador', async () => {
      const { user: anotherUser } = await createTestUser({ email: 'outro2@email.com' });
      const team = await createTestTeam(anotherUser.id);

      const response = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });
});
