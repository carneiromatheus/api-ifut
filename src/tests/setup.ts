import prisma from '../config/database';

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key';
process.env.JWT_EXPIRES_IN = '1h';

// Clean database before each test
beforeEach(async () => {
  // Delete all data in reverse dependency order
  await prisma.estatistica.deleteMany();
  await prisma.escalacao.deleteMany();
  await prisma.classificacao.deleteMany();
  await prisma.partida.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.fase.deleteMany();
  await prisma.inscricao.deleteMany();
  await prisma.campeonato.deleteMany();
  await prisma.jogador.deleteMany();
  await prisma.time.deleteMany();
  await prisma.usuario.deleteMany();
});

// Disconnect after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
