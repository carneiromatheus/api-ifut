import prisma from '../../prisma/client';

interface CreatePlayerData {
  nome: string;
  apelido?: string;
  dataNascimento: Date;
  posicao: string;
  numeroCamisa: number;
  documento: string;
  foto?: string;
  timeId: number;
}

export const list = async (timeId?: number) => {
  return prisma.jogador.findMany({
    where: timeId ? { timeId, ativo: true } : { ativo: true },
    include: {
      time: {
        select: { id: true, nome: true }
      }
    }
  });
};

export const getById = async (id: number) => {
  const player = await prisma.jogador.findUnique({
    where: { id },
    include: {
      time: {
        select: { id: true, nome: true, cidade: true }
      }
    }
  });

  if (!player) {
    throw new Error('Jogador não encontrado');
  }

  return player;
};

export const create = async (data: CreatePlayerData, userId: number) => {
  const { nome, dataNascimento, posicao, numeroCamisa, documento, timeId } = data;

  if (!nome || !dataNascimento || !posicao || !numeroCamisa || !documento || !timeId) {
    throw new Error('Campos obrigatórios faltando');
  }

  const team = await prisma.time.findUnique({ where: { id: timeId } });
  if (!team) {
    throw new Error('Time não encontrado');
  }

  if (team.responsavelId !== userId) {
    throw new Error('Apenas o responsável do time pode adicionar jogadores');
  }

  const existingDoc = await prisma.jogador.findUnique({ where: { documento } });
  if (existingDoc) {
    throw new Error('Documento já cadastrado');
  }

  const existingNumber = await prisma.jogador.findFirst({
    where: { timeId, numeroCamisa, ativo: true }
  });
  if (existingNumber) {
    throw new Error('Número de camisa já em uso no time');
  }

  return prisma.jogador.create({
    data: {
      ...data,
      dataNascimento: new Date(dataNascimento)
    },
    include: {
      time: { select: { id: true, nome: true } }
    }
  });
};

export const update = async (id: number, data: Partial<CreatePlayerData>, userId: number) => {
  const player = await prisma.jogador.findUnique({
    where: { id },
    include: { time: true }
  });

  if (!player) {
    throw new Error('Jogador não encontrado');
  }

  if (player.time.responsavelId !== userId) {
    throw new Error('Apenas o responsável do time pode atualizar jogadores');
  }

  return prisma.jogador.update({
    where: { id },
    data: {
      ...data,
      dataNascimento: data.dataNascimento ? new Date(data.dataNascimento) : undefined
    }
  });
};

export const remove = async (id: number, userId: number) => {
  const player = await prisma.jogador.findUnique({
    where: { id },
    include: { time: true }
  });

  if (!player) {
    throw new Error('Jogador não encontrado');
  }

  if (player.time.responsavelId !== userId) {
    throw new Error('Apenas o responsável do time pode remover jogadores');
  }

  return prisma.jogador.update({
    where: { id },
    data: { ativo: false }
  });
};
/**
 * Get all players with their aggregated statistics
 * Includes total goals and assists across all championships
 */
export const listWithStats = async (timeId?: number) => {
  const players = await prisma.jogador.findMany({
    where: timeId ? { timeId, ativo: true } : { ativo: true },
    include: {
      time: {
        select: { id: true, nome: true }
      }
    }
  });

  // For each player, aggregate their statistics
  const playersWithStats = await Promise.all(
    players.map(async (player) => {
      const stats = await prisma.estatistica.aggregate({
        where: { jogadorId: player.id },
        _sum: {
          gols: true,
          assistencias: true,
          cartoesAmarelos: true,
          cartoesVermelhos: true
        },
        _count: {
          partidaId: true
        }
      });

      return {
        ...player,
        gols: stats._sum.gols || 0,
        assistencias: stats._sum.assistencias || 0,
        cartoesAmarelos: stats._sum.cartoesAmarelos || 0,
        cartoesVermelhos: stats._sum.cartoesVermelhos || 0,
        jogosTotal: stats._count.partidaId
      };
    })
  );

  return playersWithStats;
};