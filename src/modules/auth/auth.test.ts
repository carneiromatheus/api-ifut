import request from 'supertest';
import app from '../../app';
import prisma from '../../config/database';
import { createTestUser } from '../../tests/helpers';

describe('Auth Module', () => {
  describe('POST /api/auth/register', () => {
    it('deve cadastrar novo usuário com sucesso', async () => {
      const userData = {
        nome: 'João Silva',
        email: 'joao@email.com',
        senha: 'senha12345',
        tipo: 'comum',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.nome).toBe(userData.nome);
      expect(response.body.data.user.senha).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('deve criar registro de organizador quando tipo é organizador', async () => {
      const userData = {
        nome: 'Maria Organizadora',
        email: 'maria@email.com',
        senha: 'senha12345',
        tipo: 'organizador',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.data.user.tipo).toBe('organizador');
    });

    it('deve retornar erro se email já existe', async () => {
      // Arrange: criar usuário
      await createTestUser({ email: 'existente@email.com' });

      // Act: tentar cadastrar com mesmo email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Outro Nome',
          email: 'existente@email.com',
          senha: 'senha12345',
          tipo: 'comum',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('email');
    });

    it('deve retornar erro se senha < 8 caracteres', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'João Silva',
          email: 'joao@email.com',
          senha: '1234567',
          tipo: 'comum',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se tipo inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'João Silva',
          email: 'joao@email.com',
          senha: 'senha12345',
          tipo: 'invalido',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se nome vazio', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: '',
          email: 'joao@email.com',
          senha: 'senha12345',
          tipo: 'comum',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'João Silva',
          email: 'email-invalido',
          senha: 'senha12345',
          tipo: 'comum',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com sucesso', async () => {
      // Arrange: criar usuário
      const { user, plainPassword } = await createTestUser({ email: 'login@email.com' });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          senha: plainPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.token).toBeDefined();
    });

    it('deve retornar erro se email não existe', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@email.com',
          senha: 'senha12345',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Credenciais inválidas');
    });

    it('deve retornar erro se senha incorreta', async () => {
      // Arrange: criar usuário
      const { user } = await createTestUser({ email: 'senhaerrada@email.com' });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          senha: 'senhaerrada',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/me', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      // Arrange: criar usuário e obter token
      const { user, token } = await createTestUser();

      // Act
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.senha).toBeUndefined();
    });

    it('deve retornar erro se não autenticado', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('deve retornar erro se token inválido', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer token_invalido');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('deve editar perfil do usuário autenticado', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .patch('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe('Nome Atualizado');
    });

    it('deve retornar erro se não autenticado', async () => {
      const response = await request(app)
        .patch('/api/users/me')
        .send({ nome: 'Nome Atualizado' });

      expect(response.status).toBe(401);
    });
  });
});
