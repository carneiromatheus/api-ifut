import prisma from '../../prisma/client';

interface CreateTeamData {
  nome: string;
  cidade: string;
  escudo?: string;
  fundadoEm?: Date;
}

export const list = async () => {
  return prisma.time.findMany({
    include: {
      responsavel: {
        select: { id: true, nome: true, email: true }
      },
      _count: { select: { jogadores: true } }
    }
  });
};

export const getById = async (id: number) => {
  const team = await prisma.time.findUnique({
    where: { id },
    include: {
      responsavel: {
        select: { id: true, nome: true, email: true }
      },
      jogadores: {
        where: { ativo: true },
        select: {
          id: true,
          nome: true,
          apelido: true,
          posicao: true,
          numeroCamisa: true
        }
      }
    }
  });

  if (!team) {
    throw new Error('Time não encontrado');
  }

  return team;
};

export const create = async (data: CreateTeamData, userId: number) => {
  const { nome, cidade, escudo, fundadoEm } = data;

  if (!nome || !cidade) {
    throw new Error('Nome e cidade são obrigatórios');
  }

  return prisma.time.create({
    data: {
      nome,
      cidade,
      escudo,
      fundadoEm: fundadoEm ? new Date(fundadoEm) : undefined,
      responsavelId: userId
    },
    include: {
      responsavel: {
        select: { id: true, nome: true, email: true }
      }
    }
  });
};

export const update = async (id: number, data: Partial<CreateTeamData>, userId: number) => {
  const team = await prisma.time.findUnique({ where: { id } });
  
  if (!team) {
    throw new Error('Time não encontrado');
  }

  if (team.responsavelId !== userId) {
    throw new Error('Apenas o responsável pode atualizar o time');
  }

  return prisma.time.update({
    where: { id },
    data: {
      ...data,
      fundadoEm: data.fundadoEm ? new Date(data.fundadoEm) : undefined
    }
  });
};

export const remove = async (id: number, userId: number) => {
  const team = await prisma.time.findUnique({ where: { id } });
  
  if (!team) {
    throw new Error('Time não encontrado');
  }

  if (team.responsavelId !== userId) {
    throw new Error('Apenas o responsável pode remover o time');
  }

  return prisma.time.delete({ where: { id } });
};
