import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clear all tables before tests
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export async function cleanDatabase() {
  const tables = [
    'estatisticas',
    'escalacoes',
    'classificacoes',
    'partidas',
    'inscricoes',
    'jogadores',
    'times',
    'campeonatos',
    'usuarios',
    'auditoria_logs',
    'notificacoes',
    'configuracoes_sistema'
  ];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE`);
    } catch (e) {
      // Table might not exist yet
    }
  }
}

export { prisma };
