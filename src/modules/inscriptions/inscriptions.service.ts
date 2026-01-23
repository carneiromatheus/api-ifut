import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';
import { StatusInscricao } from '@prisma/client';

export const create = async (campeonatoId: number, timeId: number, userId: number) => {
  // Check if championship exists and is open
  const championship = await prisma.campeonato.findUnique({
    where: { id: campeonatoId },
  });

  if (!championship) {
    throw new AppError('Campeonato não encontrado', 404, 'CHAMPIONSHIP_NOT_FOUND');
  }

  // Check if team exists and user is the creator
  const team = await prisma.time.findUnique({
    where: { id: timeId },
    include: {
      _count: {
        select: { jogadores: true },
      },
    },
  });

  if (!team) {
    throw new AppError('Time não encontrado', 404, 'TEAM_NOT_FOUND');
  }

  if (team.responsavelId !== userId) {
    throw new AppError('Apenas o criador do time pode inscrevê-lo', 403, 'FORBIDDEN');
  }

  // Check if team has at least 7 players (RN03)
  if (team._count.jogadores < 7) {
    throw new AppError('Time precisa ter mínimo 7 jogadores para se inscrever', 400, 'INSUFFICIENT_PLAYERS');
  }

  // Check if team is already inscribed (RN04)
  const existingInscription = await prisma.inscricao.findUnique({
    where: {
      campeonatoId_timeId: {
        campeonatoId: campeonatoId,
        timeId: timeId,
      },
    },
  });

  if (existingInscription) {
    throw new AppError('Time já inscrito neste campeonato', 400, 'ALREADY_INSCRIBED');
  }

  // Create inscription with status "pendente" (RN08)
  const inscription = await prisma.inscricao.create({
    data: {
      campeonatoId: campeonatoId,
      timeId: timeId,
      status: 'pendente',
    },
    include: {
      time: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  return inscription;
};

export const findByCampeonato = async (
  campeonatoId: number,
  organizadorId: number,
  status?: StatusInscricao
) => {
  // Check if championship exists and user is the organizer owner
  const championship = await prisma.campeonato.findUnique({
    where: { id: campeonatoId },
  });

  if (!championship) {
    throw new AppError('Campeonato não encontrado', 404, 'CHAMPIONSHIP_NOT_FOUND');
  }

  if (championship.organizadorId !== organizadorId) {
    throw new AppError('Apenas o organizador dono pode ver as inscrições', 403, 'FORBIDDEN');
  }

  const where: any = { campeonatoId: campeonatoId };

  if (status) {
    where.status = status;
  }

  const inscriptions = await prisma.inscricao.findMany({
    where,
    include: {
      time: {
        select: {
          id: true,
          nome: true,
          escudo: true,
          _count: {
            select: { jogadores: true },
          },
        },
      },
    },
    orderBy: { criadoEm: 'desc' },
  });

  return inscriptions;
};

export const update = async (
  inscriptionId: number,
  organizadorId: number,
  status: StatusInscricao
) => {
  // Check if inscription exists
  const inscription = await prisma.inscricao.findUnique({
    where: { id: inscriptionId },
    include: { campeonato: true },
  });

  if (!inscription) {
    throw new AppError('Inscrição não encontrada', 404, 'INSCRIPTION_NOT_FOUND');
  }

  if (inscription.campeonato.organizadorId !== organizadorId) {
    throw new AppError('Apenas o organizador dono pode atualizar inscrições', 403, 'FORBIDDEN');
  }

  const updatedInscription = await prisma.inscricao.update({
    where: { id: inscriptionId },
    data: { status },
    include: {
      time: {
        select: {
          id: true,
          nome: true,
        },
      },
    },
  });

  return updatedInscription;
};

export default { create, findByCampeonato, update };
