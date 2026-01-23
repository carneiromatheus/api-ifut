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
    organizer: {
      id: String(c.organizador.id),
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
    started: c.iniciado,
    organizer: {
      id: String(c.organizador.id),
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
    started: c.iniciado,
    organizer: {
      id: String(c.organizador.id),
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
    started: championship.iniciado,
    organizer: {
      id: String(championship.organizador.id),
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
    started: championship.iniciado,
    organizer: {
      id: String(championship.organizador.id),
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
    started: updatedChampionship.iniciado,
    organizer: {
      id: String(updatedChampionship.organizador.id),
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

  if (championship.iniciado) {
    throw new Error('Campeonato já foi iniciado');
  }

  // Get approved registrations
  const registrations = await prisma.inscricao.findMany({
    where: {
      campeonatoId: id,
      status: 'aprovada'
    },
    include: {
      time: {
        select: { id: true, nome: true }
      }
    }
  });

  if (registrations.length < championship.limiteTimesMinimo) {
    throw new Error(`Número mínimo de times não atingido. Mínimo: ${championship.limiteTimesMinimo}, Atual: ${registrations.length}`);
  }

  // Check if there are already matches created
  const existingMatches = await prisma.partida.count({
    where: { campeonatoId: id }
  });

  if (existingMatches > 0) {
    throw new Error('O campeonato já possui partidas criadas');
  }

  // Create classification entries for all teams
  const teamIds = registrations.map(r => r.timeId);
  await prisma.classificacao.createMany({
    data: teamIds.map(timeId => ({
      campeonatoId: id,
      timeId,
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldoGols: 0
    })),
    skipDuplicates: true
  });

  // Mark as started
  const updatedChampionship = await prisma.campeonato.update({
    where: { id },
    data: { 
      iniciado: true
    },
    include: {
      organizador: {
        select: { id: true, nome: true, email: true }
      }
    }
  });

  // Generate matches based on championship type
  if (championship.tipo === 'pontos_corridos') {
    // Round-robin: all teams play against each other (home and away)
    const teamIds = registrations.map(r => r.timeId);
    const numTeams = teamIds.length;
    
    // Shuffle teams for randomization
    const shuffledTeams = [...teamIds];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }
    
    // Generate round-robin schedule using circle method
    const teams = numTeams % 2 === 0 ? shuffledTeams : [...shuffledTeams, null];
    const totalTeams = teams.length;
    const numRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;
    
    const allMatches = [];
    
    // First round (turno - ida)
    for (let round = 0; round < numRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = match === 0 ? 0 : (round + match) % numRounds + 1;
        const away = (numRounds + round - match) % numRounds + 1;
        
        const homeTeam = teams[home];
        const awayTeam = teams[away];
        
        if (homeTeam !== null && awayTeam !== null) {
          allMatches.push({
            campeonatoId: id,
            timeCasaId: homeTeam,
            timeVisitanteId: awayTeam,
            rodada: round + 1,
            dataHora: null,
            local: 'A definir',
            status: 'agendada' as const
          });
        }
      }
    }
    
    // Second round (returno - volta) - swap home and away
    for (let round = 0; round < numRounds; round++) {
      for (let match = 0; match < matchesPerRound; match++) {
        const home = match === 0 ? 0 : (round + match) % numRounds + 1;
        const away = (numRounds + round - match) % numRounds + 1;
        
        const homeTeam = teams[home];
        const awayTeam = teams[away];
        
        if (homeTeam !== null && awayTeam !== null) {
          allMatches.push({
            campeonatoId: id,
            timeCasaId: awayTeam, // Swap: away becomes home
            timeVisitanteId: homeTeam, // Swap: home becomes away
            rodada: numRounds + round + 1,
            dataHora: null,
            local: 'A definir',
            status: 'agendada' as const
          });
        }
      }
    }
    
    // Create matches in database
    await prisma.partida.createMany({
      data: allMatches
    });
  } else if (championship.tipo === 'mata_mata') {
    // Knockout: create bracket-style matches with phases
    const teamIds = registrations.map(r => r.timeId);
    
    // Validate number of teams for knockout (must be power of 2: 4, 8, 16, etc.)
    const isPowerOf2 = (teamIds.length & (teamIds.length - 1)) === 0;
    if (!isPowerOf2) {
      throw new Error('Campeonato mata-mata requer um número de times que seja potência de 2 (4, 8, 16, etc.)');
    }
    
    // Shuffle teams for randomization
    const shuffledTeams = [...teamIds];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }
    
    // Determine phase names
    const numTeams = shuffledTeams.length;
    const phaseNames: { [key: number]: string } = {
      2: 'Final',
      4: 'Semifinal',
      8: 'Quartas de Final',
      16: 'Oitavas de Final',
    };
    
    const phaseName = phaseNames[numTeams] || `Fase de ${numTeams}`;
    
    // Create first phase
    const firstPhase = await prisma.fase.create({
      data: {
        campeonatoId: id,
        nome: phaseName,
        ordem: 1
      }
    });
    
    // Create first round matches
    const firstRoundMatches = [];
    const matchTimes = ['15:00', '17:00', '19:00', '21:00'];
    
    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const matchDate = new Date(championship.dataInicio);
      const matchIndex = Math.floor(i / 2);
      
      // Spread matches over different days
      matchDate.setDate(matchDate.getDate() + Math.floor(matchIndex / 2));
      
      // Set time
      const timeIndex = matchIndex % matchTimes.length;
      const [hours, minutes] = matchTimes[timeIndex].split(':').map(Number);
      matchDate.setHours(hours, minutes, 0, 0);
      
      firstRoundMatches.push({
        campeonatoId: id,
        faseId: firstPhase.id,
        timeCasaId: shuffledTeams[i],
        timeVisitanteId: shuffledTeams[i + 1],
        rodada: 1,
        dataHora: matchDate,
        local: 'A definir',
        status: 'agendada' as const
      });
    }
    
    await prisma.partida.createMany({
      data: firstRoundMatches
    });
  } else if (championship.tipo === 'misto') {
    // Mixed: groups + knockout
    const teamIds = registrations.map(r => r.timeId);
    const numTeams = teamIds.length;
    
    // Validate minimum teams for mixed (at least 8)
    if (numTeams < 8) {
      throw new Error('Campeonato misto requer no mínimo 8 times');
    }
    
    // Shuffle teams for randomization
    const shuffledTeams = [...teamIds];
    for (let i = shuffledTeams.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledTeams[i], shuffledTeams[j]] = [shuffledTeams[j], shuffledTeams[i]];
    }
    
    // Divide into groups (2 groups for simplicity)
    const numGroups = 2;
    const teamsPerGroup = Math.floor(numTeams / numGroups);
    
    const groups = [];
    for (let g = 0; g < numGroups; g++) {
      const grupo = await prisma.grupo.create({
        data: {
          campeonatoId: id,
          nome: String.fromCharCode(65 + g) // A, B, C, etc.
        }
      });
      groups.push(grupo);
      
      // Assign teams to group
      const groupTeams = shuffledTeams.slice(g * teamsPerGroup, (g + 1) * teamsPerGroup);
      
      // Update inscriptions with group
      await prisma.inscricao.updateMany({
        where: {
          campeonatoId: id,
          timeId: { in: groupTeams }
        },
        data: {
          grupoId: grupo.id
        }
      });
      
      // Create round-robin matches within the group
      const allMatches = [];
      const matchTimes = ['15:00', '17:00', '19:00', '21:00'];
      let matchCounter = 0;
      
      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          const matchDate = new Date(championship.dataInicio);
          matchDate.setDate(matchDate.getDate() + Math.floor(matchCounter / 4) * 7); // Multiple matches per week
          
          const timeIndex = matchCounter % matchTimes.length;
          const [hours, minutes] = matchTimes[timeIndex].split(':').map(Number);
          matchDate.setHours(hours, minutes, 0, 0);
          
          allMatches.push({
            campeonatoId: id,
            grupoId: grupo.id,
            timeCasaId: groupTeams[i],
            timeVisitanteId: groupTeams[j],
            rodada: Math.floor(matchCounter / matchTimes.length) + 1,
            dataHora: matchDate,
            local: 'A definir',
            status: 'agendada' as const
          });
          
          matchCounter++;
        }
      }
      
      await prisma.partida.createMany({
        data: allMatches
      });
    }
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
    started: updatedChampionship.iniciado,
    organizer: {
      id: String(updatedChampionship.organizador.id),
      name: updatedChampionship.organizador.nome,
      email: updatedChampionship.organizador.email
    },
    createdAt: updatedChampionship.criadoEm.toISOString(),
    updatedAt: updatedChampionship.atualizadoEm.toISOString()
  };
};
