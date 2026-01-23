import prisma from '../../prisma/client';
import { StatusPartida } from '@prisma/client';

interface CreateMatchData {
  campeonatoId: number;
  timeCasaId: number;
  timeVisitanteId: number;
  rodada: number;
  dataHora: Date;
  local?: string;
}

interface MatchFilters {
  status?: StatusPartida;
  rodada?: number;
}

// RN11: Apenas organizador dono pode criar partidas
export const createMatch = async (data: CreateMatchData, userId: number) => {
  const { campeonatoId, timeCasaId, timeVisitanteId, rodada, dataHora, local } = data;

  // Validate championship exists and user is organizer
  const championship = await prisma.campeonato.findUnique({
    where: { id: campeonatoId }
  });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador do campeonato pode criar partidas');
  }

  // Validate teams are different
  if (timeCasaId === timeVisitanteId) {
    throw new Error('Times da casa e visitante devem ser diferentes');
  }

  // RN12: Validate home team is approved
  const homeRegistration = await prisma.inscricao.findFirst({
    where: {
      campeonatoId,
      timeId: timeCasaId,
      status: 'aprovada'
    }
  });

  if (!homeRegistration) {
    throw new Error('Time da casa não está inscrito e aprovado no campeonato');
  }

  // RN12: Validate away team is approved
  const awayRegistration = await prisma.inscricao.findFirst({
    where: {
      campeonatoId,
      timeId: timeVisitanteId,
      status: 'aprovada'
    }
  });

  if (!awayRegistration) {
    throw new Error('Time visitante não está inscrito e aprovado no campeonato');
  }

  // Check for duplicate match in same round
  const existingMatch = await prisma.partida.findFirst({
    where: {
      campeonatoId,
      rodada,
      OR: [
        { timeCasaId, timeVisitanteId },
        { timeCasaId: timeVisitanteId, timeVisitanteId: timeCasaId }
      ]
    }
  });

  if (existingMatch) {
    throw new Error('Confronto já existe nesta rodada');
  }

  return prisma.partida.create({
    data: {
      campeonatoId,
      timeCasaId,
      timeVisitanteId,
      rodada,
      dataHora: new Date(dataHora),
      local,
      status: 'agendada'
    },
    include: {
      timeCasa: { select: { id: true, nome: true } },
      timeVisitante: { select: { id: true, nome: true } },
      campeonato: { select: { id: true, nome: true } }
    }
  });
};

export const listByChampionship = async (campeonatoId: number, filters?: MatchFilters) => {
  const where: any = { campeonatoId };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.rodada) {
    where.rodada = filters.rodada;
  }

  return prisma.partida.findMany({
    where,
    include: {
      timeCasa: { select: { id: true, nome: true } },
      timeVisitante: { select: { id: true, nome: true } },
      campeonato: { select: { id: true, nome: true } }
    },
    orderBy: [{ rodada: 'asc' }, { dataHora: 'asc' }]
  });
};

export const getById = async (id: number) => {
  const match = await prisma.partida.findUnique({
    where: { id },
    include: {
      timeCasa: {
        select: {
          id: true,
          nome: true,
          cidade: true,
          escudo: true
        }
      },
      timeVisitante: {
        select: {
          id: true,
          nome: true,
          cidade: true,
          escudo: true
        }
      },
      campeonato: {
        select: {
          id: true,
          nome: true,
          tipo: true
        }
      },
      escalacoes: {
        include: {
          jogador: {
            select: {
              id: true,
              nome: true,
              apelido: true,
              posicao: true,
              numeroCamisa: true
            }
          }
        }
      },
      estatisticas: {
        include: {
          jogador: {
            select: {
              id: true,
              nome: true,
              apelido: true
            }
          }
        }
      }
    }
  });

  if (!match) {
    throw new Error('Partida não encontrada');
  }

  return match;
};

interface UpdateMatchData {
  dataHora?: Date;
  local?: string;
}

export const updateMatch = async (id: number, data: UpdateMatchData, userId: number) => {
  const match = await prisma.partida.findUnique({
    where: { id },
    include: {
      campeonato: {
        select: { organizadorId: true }
      }
    }
  });

  if (!match) {
    throw new Error('Partida não encontrada');
  }

  // Only organizer can update match details
  if (match.campeonato.organizadorId !== userId) {
    throw new Error('Apenas o organizador do campeonato pode atualizar a partida');
  }

  // Can't update finished matches
  if (match.status === 'finalizada') {
    throw new Error('Não é possível atualizar partidas finalizadas');
  }

  const updateData: any = {};
  
  if (data.dataHora) {
    updateData.dataHora = new Date(data.dataHora);
  }
  
  if (data.local !== undefined) {
    updateData.local = data.local;
  }

  return prisma.partida.update({
    where: { id },
    data: updateData,
    include: {
      timeCasa: { select: { id: true, nome: true } },
      timeVisitante: { select: { id: true, nome: true } },
      campeonato: { select: { id: true, nome: true } }
    }
  });
};
