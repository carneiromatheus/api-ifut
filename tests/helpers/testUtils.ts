import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../src/utils/jwt';

const prisma = new PrismaClient();

export async function createTestUser(data: {
  nome?: string;
  email?: string;
  senha?: string;
  tipo?: 'administrador' | 'organizador' | 'tecnico';
} = {}) {
  const hashedPassword = await bcrypt.hash(data.senha || 'senha123', 10);
  
  const user = await prisma.usuario.create({
    data: {
      nome: data.nome || 'Test User',
      email: data.email || `test${Date.now()}@test.com`,
      senha: hashedPassword,
      tipo: data.tipo || 'organizador'
    }
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    tipo: user.tipo
  });

  return { user, token };
}

export async function createTestTeam(responsavelId: number, data: {
  nome?: string;
  cidade?: string;
} = {}) {
  return prisma.time.create({
    data: {
      nome: data.nome || `Time Test ${Date.now()}`,
      cidade: data.cidade || 'Cidade Teste',
      responsavelId
    }
  });
}

export async function createTestChampionship(organizadorId: number, data: {
  nome?: string;
  dataInicio?: Date;
} = {}) {
  return prisma.campeonato.create({
    data: {
      nome: data.nome || `Campeonato Test ${Date.now()}`,
      dataInicio: data.dataInicio || new Date(),
      organizadorId,
      tipo: 'pontos_corridos'
    }
  });
}

export async function createApprovedRegistration(campeonatoId: number, timeId: number) {
  // Create registration and classification
  const registration = await prisma.inscricao.create({
    data: {
      campeonatoId,
      timeId,
      status: 'aprovada'
    }
  });

  await prisma.classificacao.upsert({
    where: {
      campeonatoId_timeId: { campeonatoId, timeId }
    },
    create: { campeonatoId, timeId },
    update: {}
  });

  return registration;
}

export async function createTestPlayer(timeId: number, data: {
  nome?: string;
  posicao?: string;
  numeroCamisa?: number;
  documento?: string;
} = {}) {
  return prisma.jogador.create({
    data: {
      nome: data.nome || `Jogador Test ${Date.now()}`,
      posicao: data.posicao || 'Atacante',
      numeroCamisa: data.numeroCamisa || Math.floor(Math.random() * 99) + 1,
      documento: data.documento || `${Date.now()}`.slice(-11).padStart(11, '0'),
      dataNascimento: new Date('1995-01-01'),
      timeId
    }
  });
}

export async function createTestMatch(campeonatoId: number, timeCasaId: number, timeVisitanteId: number, data: {
  rodada?: number;
  dataHora?: Date;
  status?: 'agendada' | 'em_andamento' | 'finalizada' | 'cancelada';
} = {}) {
  return prisma.partida.create({
    data: {
      campeonatoId,
      timeCasaId,
      timeVisitanteId,
      rodada: data.rodada || 1,
      dataHora: data.dataHora || new Date(),
      status: data.status || 'agendada'
    }
  });
}

export { prisma };
