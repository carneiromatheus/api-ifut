import prisma from '../../prisma/client';
import { StatusInscricao } from '@prisma/client';

interface CreateRegistrationData {
  campeonatoId: number;
  timeId: number;
}

export const listByChampionship = async (campeonatoId: number) => {
  return prisma.inscricao.findMany({
    where: { campeonatoId },
    include: {
      time: {
        select: { id: true, nome: true, cidade: true }
      },
      campeonato: {
        select: { id: true, nome: true }
      }
    }
  });
};

export const create = async (data: CreateRegistrationData, userId: number) => {
  const { campeonatoId, timeId } = data;

  if (!campeonatoId || !timeId) {
    throw new Error('Campeonato e time são obrigatórios');
  }

  const championship = await prisma.campeonato.findUnique({ where: { id: campeonatoId } });
  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (!championship.inscricoesAbertas) {
    throw new Error('Inscrições fechadas para este campeonato');
  }

  const team = await prisma.time.findUnique({ where: { id: timeId } });
  if (!team) {
    throw new Error('Time não encontrado');
  }

  if (team.responsavelId !== userId) {
    throw new Error('Apenas o responsável do time pode inscrever');
  }

  const existingRegistration = await prisma.inscricao.findUnique({
    where: { campeonatoId_timeId: { campeonatoId, timeId } }
  });
  if (existingRegistration) {
    throw new Error('Time já inscrito neste campeonato');
  }

  const approvedCount = await prisma.inscricao.count({
    where: { campeonatoId, status: 'aprovada' }
  });
  if (approvedCount >= championship.limiteTimesMaximo) {
    throw new Error('Limite de times atingido');
  }

  return prisma.inscricao.create({
    data: { campeonatoId, timeId },
    include: {
      time: { select: { id: true, nome: true } },
      campeonato: { select: { id: true, nome: true } }
    }
  });
};

export const approve = async (id: number, userId: number) => {
  const registration = await prisma.inscricao.findUnique({
    where: { id },
    include: { campeonato: true }
  });

  if (!registration) {
    throw new Error('Inscrição não encontrada');
  }

  if (registration.campeonato.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode aprovar inscrições');
  }

  if (registration.status !== 'pendente') {
    throw new Error('Inscrição já processada');
  }

  // Initialize classification for the team when approved
  await prisma.classificacao.upsert({
    where: {
      campeonatoId_timeId: {
        campeonatoId: registration.campeonatoId,
        timeId: registration.timeId
      }
    },
    create: {
      campeonatoId: registration.campeonatoId,
      timeId: registration.timeId
    },
    update: {}
  });

  return prisma.inscricao.update({
    where: { id },
    data: { status: 'aprovada' },
    include: {
      time: { select: { id: true, nome: true } }
    }
  });
};

export const reject = async (id: number, motivo: string, userId: number) => {
  const registration = await prisma.inscricao.findUnique({
    where: { id },
    include: { campeonato: true }
  });

  if (!registration) {
    throw new Error('Inscrição não encontrada');
  }

  if (registration.campeonato.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode rejeitar inscrições');
  }

  if (registration.status !== 'pendente') {
    throw new Error('Inscrição já processada');
  }

  return prisma.inscricao.update({
    where: { id },
    data: { status: 'rejeitada', motivoRejeicao: motivo },
    include: {
      time: { select: { id: true, nome: true } }
    }
  });
};
