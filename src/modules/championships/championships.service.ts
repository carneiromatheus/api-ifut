import prisma from '../../prisma/client';
import { TipoCampeonato } from '@prisma/client';

interface CreateChampionshipData {
  nome: string;
  descricao?: string;
  tipo?: TipoCampeonato;
  dataInicio: Date;
  dataFim?: Date;
  limiteTimesMinimo?: number;
  limiteTimesMaximo?: number;
}

export const list = async () => {
  return prisma.campeonato.findMany({
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      _count: {
        select: { inscricoes: true, partidas: true }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });
};

export const getById = async (id: number) => {
  const championship = await prisma.campeonato.findUnique({
    where: { id },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      inscricoes: {
        include: {
          time: {
            select: { id: true, nome: true, cidade: true }
          }
        }
      }
    }
  });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  return championship;
};

export const create = async (data: CreateChampionshipData, userId: number) => {
  const { nome, descricao, tipo = 'pontos_corridos', dataInicio, dataFim } = data;

  if (!nome || !dataInicio) {
    throw new Error('Nome e data de início são obrigatórios');
  }

  // Only pontos_corridos is supported for now
  if (tipo !== 'pontos_corridos') {
    throw new Error('Apenas campeonatos do tipo pontos_corridos são suportados');
  }

  return prisma.campeonato.create({
    data: {
      nome,
      descricao,
      tipo,
      dataInicio: new Date(dataInicio),
      dataFim: dataFim ? new Date(dataFim) : undefined,
      limiteTimesMinimo: data.limiteTimesMinimo || 4,
      limiteTimesMaximo: data.limiteTimesMaximo || 20,
      organizadorId: userId
    },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });
};

export const update = async (id: number, data: Partial<CreateChampionshipData>, userId: number) => {
  const championship = await prisma.campeonato.findUnique({ where: { id } });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode atualizar o campeonato');
  }

  return prisma.campeonato.update({
    where: { id },
    data: {
      ...data,
      dataInicio: data.dataInicio ? new Date(data.dataInicio) : undefined,
      dataFim: data.dataFim ? new Date(data.dataFim) : undefined
    }
  });
};

export const remove = async (id: number, userId: number) => {
  const championship = await prisma.campeonato.findUnique({ where: { id } });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode remover o campeonato');
  }

  return prisma.campeonato.delete({ where: { id } });
};
