import request from 'supertest';
import app from '../../app';
import { createTestUser, createTestChampionship } from '../../tests/helpers';

describe('Championships Module', () => {
  let organizerToken: string;
  let organizerId: number;
  let commonUserToken: string;

  beforeEach(async () => {
    // Create organizer user
    const { token: orgToken, organizador } = await createTestUser({ 
      email: 'organizador@email.com',
      tipo: 'organizador' 
    });
    organizerToken = orgToken;
    organizerId = organizador!.id;

    // Create common user
    const { token: comToken } = await createTestUser({ 
      email: 'comum@email.com',
      tipo: 'comum' 
    });
    commonUserToken = comToken;
  });

  describe('POST /api/championships', () => {
    it('deve criar campeonato se for organizador', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const championshipData = {
        nome: 'Copa Várzea 2026',
        descricao: 'Campeonato de futebol amador',
        tipo: 'pontos_corridos',
        data_inicio: futureDate.toISOString().split('T')[0],
      };

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(championshipData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(championshipData.nome);
      expect(response.body.data.status).toBe('aberto');
    });

    it('deve retornar erro se não for organizador', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', `Bearer ${commonUserToken}`)
        .send({
          nome: 'Copa Várzea 2026',
          tipo: 'pontos_corridos',
          data_inicio: futureDate.toISOString().split('T')[0],
        });

      expect(response.status).toBe(403);
    });

    it('deve retornar erro se tipo inválido', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          nome: 'Copa Várzea 2026',
          tipo: 'tipo_invalido',
          data_inicio: futureDate.toISOString().split('T')[0],
        });

      expect(response.status).toBe(400);
    });

    it('deve retornar erro se data_inicio no passado', async () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);

      const response = await request(app)
        .post('/api/championships')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          nome: 'Copa Várzea 2026',
          tipo: 'pontos_corridos',
          data_inicio: pastDate.toISOString().split('T')[0],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/championships', () => {
    it('deve listar campeonatos (público)', async () => {
      await createTestChampionship(organizerId, { nome: 'Copa 1' });
      await createTestChampionship(organizerId, { nome: 'Copa 2' });
      await createTestChampionship(organizerId, { nome: 'Copa 3' });

      const response = await request(app).get('/api/championships');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(3);
    });

    it('deve filtrar por status', async () => {
      await createTestChampionship(organizerId, { status: 'aberto' });
      await createTestChampionship(organizerId, { status: 'em_andamento' });
      await createTestChampionship(organizerId, { status: 'aberto' });

      const response = await request(app).get('/api/championships?status=aberto');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('deve filtrar por tipo', async () => {
      await createTestChampionship(organizerId, { tipo: 'pontos_corridos' });
      await createTestChampionship(organizerId, { tipo: 'mata_mata' });

      const response = await request(app).get('/api/championships?tipo=pontos_corridos');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });

    it('deve buscar por nome', async () => {
      await createTestChampionship(organizerId, { nome: 'Copa da Várzea' });
      await createTestChampionship(organizerId, { nome: 'Campeonato de Bairro' });

      const response = await request(app).get('/api/championships?search=Copa');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].nome).toBe('Copa da Várzea');
    });
  });

  describe('GET /api/championships/:id', () => {
    it('deve retornar detalhes do campeonato', async () => {
      const championship = await createTestChampionship(organizerId, { nome: 'Meu Campeonato' });

      const response = await request(app).get(`/api/championships/${championship.id}`);

      expect(response.status).toBe(200);
      expect(response.body.data.nome).toBe('Meu Campeonato');
      expect(response.body.data.organizador).toBeDefined();
    });

    it('deve retornar erro se campeonato não existe', async () => {
      const response = await request(app).get('/api/championships/99999');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/championships/:id', () => {
    it('deve editar campeonato se for organizador dono e status=aberto', async () => {
      const championship = await createTestChampionship(organizerId, { status: 'aberto' });

      const response = await request(app)
        .patch(`/api/championships/${championship.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.data.nome).toBe('Nome Atualizado');
    });

    it('deve retornar erro se não for organizador dono', async () => {
      // Create another organizer
      const { token: anotherOrgToken, organizador: anotherOrg } = await createTestUser({ 
        email: 'outro_organizador@email.com',
        tipo: 'organizador' 
      });

      const championship = await createTestChampionship(organizerId);

      const response = await request(app)
        .patch(`/api/championships/${championship.id}`)
        .set('Authorization', `Bearer ${anotherOrgToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(403);
    });

    it('deve retornar erro se status != aberto', async () => {
      const championship = await createTestChampionship(organizerId, { status: 'em_andamento' });

      const response = await request(app)
        .patch(`/api/championships/${championship.id}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Campeonato já iniciado');
    });
  });

  describe('DELETE /api/championships/:id', () => {
    it('deve excluir campeonato se for organizador dono e status=aberto', async () => {
      const championship = await createTestChampionship(organizerId, { status: 'aberto' });

      const response = await request(app)
        .delete(`/api/championships/${championship.id}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
    });

    it('deve retornar erro se status != aberto', async () => {
      const championship = await createTestChampionship(organizerId, { status: 'em_andamento' });

      const response = await request(app)
        .delete(`/api/championships/${championship.id}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(400);
    });
  });
});
