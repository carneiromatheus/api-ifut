import prisma from '../../prisma/client';
import { TipoCampeonato } from '@prisma/client';

interface CreateChampionshipData {
  name: string;
  description?: string;
  type?: 'ROUND_ROBIN' | 'KNOCKOUT' | 'MIXED';
  startDate: Date;
  endDate?: Date;
  minTeams?: number;
  maxTeams?: number;
}

// Map championship type from English to Portuguese
function mapTypeToTipoCampeonato(type: string): TipoCampeonato {
  const mapping: Record<string, TipoCampeonato> = {
    'ROUND_ROBIN': 'pontos_corridos',
    'KNOCKOUT': 'mata_mata',
    'MIXED': 'misto'
  };
  return mapping[type] || 'pontos_corridos';
}

// Map championship type from Portuguese to English
function mapTipoCampeonatoToType(tipo: TipoCampeonato): string {
  const mapping: Record<TipoCampeonato, string> = {
    'pontos_corridos': 'ROUND_ROBIN',
    'mata_mata': 'KNOCKOUT',
    'misto': 'MIXED'
  };
  return mapping[tipo] || 'ROUND_ROBIN';
}

export const list = async () => {
  const championships = await prisma.campeonato.findMany({
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      inscricoes: {
        where: { status: 'aprovada' },
        select: { id: true }
      },
      _count: {
        select: { partidas: true }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });

  return championships.map(c => ({
    id: c.id,
    name: c.nome,
    description: c.descricao,
    type: mapTipoCampeonatoToType(c.tipo),
    startDate: c.dataInicio.toISOString(),
    endDate: c.dataFim?.toISOString() || null,
    minTeams: c.limiteTimesMinimo,
    maxTeams: c.limiteTimesMaximo,
    registrationsOpen: c.inscricoesAbertas,
    organizer: {
      id: c.organizador.id,
      name: c.organizador.nome,
      email: c.organizador.email
    },
    inscriptionCount: c.inscricoes.length,
    matchCount: c._count.partidas,
    createdAt: c.criadoEm.toISOString(),
    updatedAt: c.atualizadoEm.toISOString()
  }));
};

export const listByUser = async (userId: number) => {
  const championships = await prisma.campeonato.findMany({
    where: { organizadorId: userId },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      inscricoes: {
        where: { status: 'aprovada' },
        select: { id: true }
      },
      _count: {
        select: { partidas: true }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });

  return championships.map(c => ({
    id: c.id,
    name: c.nome,
    description: c.descricao,
    type: mapTipoCampeonatoToType(c.tipo),
    startDate: c.dataInicio.toISOString(),
    endDate: c.dataFim?.toISOString() || null,
    minTeams: c.limiteTimesMinimo,
    maxTeams: c.limiteTimesMaximo,
    registrationsOpen: c.inscricoesAbertas,
    organizer: {
      id: c.organizador.id,
      name: c.organizador.nome,
      email: c.organizador.email
    },
    inscriptionCount: c.inscricoes.length,
    matchCount: c._count.partidas,
    createdAt: c.criadoEm.toISOString(),
    updatedAt: c.atualizadoEm.toISOString()
  }));
};

export const listByParticipation = async (userId: number) => {
  // Get user's teams first
  const userTeams = await prisma.time.findMany({
    where: { responsavelId: userId },
    select: { id: true }
  });

  const teamIds = userTeams.map(t => t.id);

  if (teamIds.length === 0) {
    return [];
  }

  // Get championships where user's teams are registered with approved status
  const championships = await prisma.campeonato.findMany({
    where: {
      inscricoes: {
        some: {
          timeId: { in: teamIds },
          status: 'aprovada'
        }
      }
    },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      inscricoes: {
        where: { status: 'aprovada' },
        select: { id: true }
      },
      _count: {
        select: { partidas: true }
      }
    },
    orderBy: { dataInicio: 'desc' }
  });

  return championships.map(c => ({
    id: c.id,
    name: c.nome,
    description: c.descricao,
    type: mapTipoCampeonatoToType(c.tipo),
    startDate: c.dataInicio.toISOString(),
    endDate: c.dataFim?.toISOString() || null,
    minTeams: c.limiteTimesMinimo,
    maxTeams: c.limiteTimesMaximo,
    registrationsOpen: c.inscricoesAbertas,
    organizer: {
      id: c.organizador.id,
      name: c.organizador.nome,
      email: c.organizador.email
    },
    inscriptionCount: c.inscricoes.length,
    matchCount: c._count.partidas,
    createdAt: c.criadoEm.toISOString(),
    updatedAt: c.atualizadoEm.toISOString()
  }));
};

export const getById = async (id: number) => {
  const championship = await prisma.campeonato.findUnique({
    where: { id },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      },
      inscricoes: {
        where: { status: 'aprovada' },
        select: { id: true }
      }
    }
  });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  return {
    id: championship.id,
    name: championship.nome,
    description: championship.descricao,
    type: mapTipoCampeonatoToType(championship.tipo),
    startDate: championship.dataInicio.toISOString(),
    endDate: championship.dataFim?.toISOString() || null,
    minTeams: championship.limiteTimesMinimo,
    maxTeams: championship.limiteTimesMaximo,
    registrationsOpen: championship.inscricoesAbertas,
    organizer: {
      id: championship.organizador.id,
      name: championship.organizador.nome,
      email: championship.organizador.email
    },
    inscriptionCount: championship.inscricoes.length,
    createdAt: championship.criadoEm.toISOString(),
    updatedAt: championship.atualizadoEm.toISOString()
  };
};

export const create = async (data: CreateChampionshipData, userId: number) => {
  const { name, description, type = 'ROUND_ROBIN', startDate, endDate, minTeams = 4, maxTeams = 20 } = data;

  if (!name || !startDate) {
    throw new Error('Nome e data de início são obrigatórios');
  }

  const tipoCampeonato = mapTypeToTipoCampeonato(type);

  const championship = await prisma.campeonato.create({
    data: {
      nome: name,
      descricao: description,
      tipo: tipoCampeonato,
      dataInicio: new Date(startDate),
      dataFim: endDate ? new Date(endDate) : undefined,
      limiteTimesMinimo: minTeams,
      limiteTimesMaximo: maxTeams,
      organizadorId: userId
    },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  return {
    id: championship.id,
    name: championship.nome,
    description: championship.descricao,
    type: mapTipoCampeonatoToType(championship.tipo),
    startDate: championship.dataInicio.toISOString(),
    endDate: championship.dataFim?.toISOString() || null,
    minTeams: championship.limiteTimesMinimo,
    maxTeams: championship.limiteTimesMaximo,
    registrationsOpen: championship.inscricoesAbertas,
    organizer: {
      id: championship.organizador.id,
      name: championship.organizador.nome,
      email: championship.organizador.email
    },
    createdAt: championship.criadoEm.toISOString(),
    updatedAt: championship.atualizadoEm.toISOString()
  };
};

export const update = async (id: number, data: Partial<CreateChampionshipData>, userId: number) => {
  const championship = await prisma.campeonato.findUnique({ where: { id } });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode atualizar o campeonato');
  }

  const updateData: any = {};
  
  if (data.name !== undefined) updateData.nome = data.name;
  if (data.description !== undefined) updateData.descricao = data.description;
  if (data.type !== undefined) updateData.tipo = mapTypeToTipoCampeonato(data.type);
  if (data.startDate !== undefined) updateData.dataInicio = new Date(data.startDate);
  if (data.endDate !== undefined) updateData.dataFim = data.endDate ? new Date(data.endDate) : null;
  if (data.minTeams !== undefined) updateData.limiteTimesMinimo = data.minTeams;
  if (data.maxTeams !== undefined) updateData.limiteTimesMaximo = data.maxTeams;

  const updatedChampionship = await prisma.campeonato.update({
    where: { id },
    data: updateData,
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  return {
    id: updatedChampionship.id,
    name: updatedChampionship.nome,
    description: updatedChampionship.descricao,
    type: mapTipoCampeonatoToType(updatedChampionship.tipo),
    startDate: updatedChampionship.dataInicio.toISOString(),
    endDate: updatedChampionship.dataFim?.toISOString() || null,
    minTeams: updatedChampionship.limiteTimesMinimo,
    maxTeams: updatedChampionship.limiteTimesMaximo,
    registrationsOpen: updatedChampionship.inscricoesAbertas,
    organizer: {
      id: updatedChampionship.organizador.id,
      name: updatedChampionship.organizador.nome,
      email: updatedChampionship.organizador.email
    },
    createdAt: updatedChampionship.criadoEm.toISOString(),
    updatedAt: updatedChampionship.atualizadoEm.toISOString()
  };
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

export const start = async (id: number, userId: number) => {
  const championship = await prisma.campeonato.findUnique({
    where: { id },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode iniciar o campeonato');
  }

  if (!championship.inscricoesAbertas) {
    throw new Error('Campeonato já foi iniciado');
  }

  // Get approved registrations
  const registrations = await prisma.inscricao.findMany({
    where: {
      campeonatoId: id,
      status: 'aprovada'
    }
  });

  if (registrations.length < championship.limiteTimesMinimo) {
    throw new Error(`Número mínimo de times não atingido. Mínimo: ${championship.limiteTimesMinimo}, Atual: ${registrations.length}`);
  }

  // Close registrations
  const updatedChampionship = await prisma.campeonato.update({
    where: { id },
    data: { inscricoesAbertas: false },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  // Generate matches based on championship type
  if (championship.tipo === 'pontos_corridos') {
    // Round-robin: all teams play against each other
    const teamIds = registrations.map(r => r.timeId);
    const matches = [];
    
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Home match
        matches.push({
          campeonatoId: id,
          timeCasaId: teamIds[i],
          timeVisitanteId: teamIds[j],
          rodada: 1,
          dataHora: new Date(championship.dataInicio),
          status: 'agendada' as const
        });
        // Away match
        matches.push({
          campeonatoId: id,
          timeCasaId: teamIds[j],
          timeVisitanteId: teamIds[i],
          rodada: 1,
          dataHora: new Date(championship.dataInicio),
          status: 'agendada' as const
        });
      }
    }
    
    // Shuffle matches
    for (let i = matches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matches[i], matches[j]] = [matches[j], matches[i]];
    }
    
    // Create matches in database
    await prisma.partida.createMany({
      data: matches
    });
  }

  return {
    id: updatedChampionship.id,
    name: updatedChampionship.nome,
    description: updatedChampionship.descricao,
    type: mapTipoCampeonatoToType(updatedChampionship.tipo),
    startDate: updatedChampionship.dataInicio.toISOString(),
    endDate: updatedChampionship.dataFim?.toISOString() || null,
    minTeams: updatedChampionship.limiteTimesMinimo,
    maxTeams: updatedChampionship.limiteTimesMaximo,
    registrationsOpen: updatedChampionship.inscricoesAbertas,
    organizer: {
      id: updatedChampionship.organizador.id,
      name: updatedChampionship.organizador.nome,
      email: updatedChampionship.organizador.email
    },
    createdAt: updatedChampionship.criadoEm.toISOString(),
    updatedAt: updatedChampionship.atualizadoEm.toISOString()
  };
};

export const toggleRegistrations = async (id: number, userId: number) => {
  const championship = await prisma.campeonato.findUnique({
    where: { id },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  if (!championship) {
    throw new Error('Campeonato não encontrado');
  }

  if (championship.organizadorId !== userId) {
    throw new Error('Apenas o organizador pode alterar o status de inscrições');
  }

  const updatedChampionship = await prisma.campeonato.update({
    where: { id },
    data: { inscricoesAbertas: !championship.inscricoesAbertas },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  return {
    id: updatedChampionship.id,
    name: updatedChampionship.nome,
    description: updatedChampionship.descricao,
    type: mapTipoCampeonatoToType(updatedChampionship.tipo),
    startDate: updatedChampionship.dataInicio.toISOString(),
    endDate: updatedChampionship.dataFim?.toISOString() || null,
    minTeams: updatedChampionship.limiteTimesMinimo,
    maxTeams: updatedChampionship.limiteTimesMaximo,
    registrationsOpen: updatedChampionship.inscricoesAbertas,
    organizer: {
      id: updatedChampionship.organizador.id,
      name: updatedChampionship.organizador.nome,
      email: updatedChampionship.organizador.email
    },
    createdAt: updatedChampionship.criadoEm.toISOString(),
    updatedAt: updatedChampionship.atualizadoEm.toISOString()
  };
};
