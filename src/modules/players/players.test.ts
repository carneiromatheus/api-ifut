import request from 'supertest';
import app from '../../app';
import { createTestUser, createTestTeam, createTestPlayer } from '../../tests/helpers';

describe('Players Module', () => {
  let authToken: string;
  let userId: number;
  let teamId: number;

  beforeEach(async () => {
    const { user, token } = await createTestUser();
    authToken = token;
    userId = user.id;
    const team = await createTestTeam(userId);
    teamId = team.id;
  });

  describe('POST /api/teams/:id/players', () => {
    it('deve adicionar jogador ao time', async () => {
      const playerData = {
        nome: 'Neymar Jr',
        data_nascimento: '1992-02-05',
        posicao: 'Atacante',
        numero_camisa: 10,
      };

      const response = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(playerData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(playerData.nome);
      expect(response.body.data.posicao).toBe(playerData.posicao);
      expect(response.body.data.time_id).toBe(teamId);
    });

    it('deve retornar erro se não for criador do time', async () => {
      const { user: anotherUser, token: anotherToken } = await createTestUser({ email: 'outro@email.com' });

      const response = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({
          nome: 'Jogador',
          posicao: 'Atacante',
          numero_camisa: 10,
        });

      expect(response.status).toBe(403);
    });

    it('deve retornar erro se posição inválida', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Jogador',
          posicao: 'PosicaoInvalida',
          numero_camisa: 10,
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar erro se número camisa fora de 1-99', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/players`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Jogador',
          posicao: 'Atacante',
          numero_camisa: 100,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/players', () => {
    it('deve listar jogadores (público)', async () => {
      await createTestPlayer(teamId);
      await createTestPlayer(teamId);
      await createTestPlayer(teamId);

      const response = await request(app).get('/api/players');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it('deve filtrar por posição', async () => {
      await createTestPlayer(teamId, { posicao: 'Atacante' });
      await createTestPlayer(teamId, { posicao: 'Goleiro' });
      await createTestPlayer(teamId, { posicao: 'Atacante' });

      const response = await request(app).get('/api/players?posicao=Atacante');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
      expect(response.body.data.every((p: any) => p.posicao === 'Atacante')).toBe(true);
    });

    it('deve filtrar por time', async () => {
      const { user: anotherUser } = await createTestUser({ email: 'outro3@email.com' });
      const anotherTeam = await createTestTeam(anotherUser.id);

      await createTestPlayer(teamId);
      await createTestPlayer(teamId);
      await createTestPlayer(anotherTeam.id);

      const response = await request(app).get(`/api/players?team_id=${teamId}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('GET /api/players/:id', () => {
    it('deve retornar perfil do jogador', async () => {
      const player = await createTestPlayer(teamId, { nome: 'Jogador Teste' });

      const response = await request(app).get(`/api/players/${player.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.nome).toBe('Jogador Teste');
      expect(response.body.data.time).toBeDefined();
    });

    it('deve retornar erro se jogador não existe', async () => {
      const response = await request(app).get('/api/players/99999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/players/:id', () => {
    it('deve editar jogador se for criador do time', async () => {
      const player = await createTestPlayer(teamId);

      const response = await request(app)
        .patch(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.nome).toBe('Nome Atualizado');
    });

    it('deve retornar erro se não for criador do time', async () => {
      const { token: anotherToken } = await createTestUser({ email: 'outro4@email.com' });
      const player = await createTestPlayer(teamId);

      const response = await request(app)
        .patch(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/players/:id', () => {
    it('deve remover jogador se for criador do time', async () => {
      const player = await createTestPlayer(teamId);

      const response = await request(app)
        .delete(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar erro se não for criador do time', async () => {
      const { token: anotherToken } = await createTestUser({ email: 'outro5@email.com' });
      const player = await createTestPlayer(teamId);

      const response = await request(app)
        .delete(`/api/players/${player.id}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(response.status).toBe(403);
    });
  });
});
