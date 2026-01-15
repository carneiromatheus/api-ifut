import prisma from '../../prisma/client';

/**
 * Get top scorers for a championship
 */
export const getTopScorers = async (campeonatoId: number, limit: number = 10) => {
  // Get all matches from this championship
  const matches = await prisma.partida.findMany({
    where: {
      campeonatoId,
      status: 'finalizada'
    },
    select: { id: true }
  });

  if (matches.length === 0) {
    return [];
  }

  const matchIds = matches.map(m => m.id);

  // Aggregate statistics by player
  const stats = await prisma.estatistica.groupBy({
    by: ['jogadorId'],
    where: {
      partidaId: { in: matchIds }
    },
    _sum: {
      gols: true,
      assistencias: true
    },
    _count: {
      partidaId: true
    },
    orderBy: {
      _sum: {
        gols: 'desc'
      }
    },
    take: limit
  });

  // Get player details
  const playersWithStats = await Promise.all(
    stats.map(async (stat) => {
      const player = await prisma.jogador.findUnique({
        where: { id: stat.jogadorId },
        include: {
          time: {
            select: { id: true, nome: true }
          }
        }
      });

      return {
        jogadorId: stat.jogadorId,
        nomeJogador: player?.nome || 'Desconhecido',
        timeId: player?.timeId || 0,
        nomeTime: player?.time?.nome || 'Desconhecido',
        gols: stat._sum.gols || 0,
        assistencias: stat._sum.assistencias || 0,
        jogos: stat._count.partidaId
      };
    })
  );

  return playersWithStats;
};

export const getPlayerStats = async (jogadorId: number, campeonatoId?: number) => {
  const where: any = { jogadorId };
  
  if (campeonatoId) {
    const matches = await prisma.partida.findMany({
      where: { campeonatoId, status: 'finalizada' },
      select: { id: true }
    });
    where.partidaId = { in: matches.map(m => m.id) };
  }

  const stats = await prisma.estatistica.aggregate({
    where,
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

  const player = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: {
      time: { select: { id: true, nome: true } }
    }
  });

  return {
    jogadorId,
    nomeJogador: player?.nome || 'Desconhecido',
    timeId: player?.timeId || 0,
    nomeTime: player?.time?.nome || 'Desconhecido',
    gols: stats._sum.gols || 0,
    assistencias: stats._sum.assistencias || 0,
    cartoesAmarelos: stats._sum.cartoesAmarelos || 0,
    cartoesVermelhos: stats._sum.cartoesVermelhos || 0,
    jogos: stats._count.partidaId
  };
};



/**
 * Get complete player statistics across all championships
 * GET /api/players/:id/stats
 */
export const getPlayerFullStats = async (jogadorId: number) => {
  const player = await prisma.jogador.findUnique({
    where: { id: jogadorId },
    include: {
      time: { select: { id: true, nome: true } }
    }
  });

  if (!player) {
    throw new Error('Jogador não encontrado');
  }

  // Get all statistics for this player
  const allStats = await prisma.estatistica.findMany({
    where: { jogadorId },
    include: {
      partida: {
        include: {
          campeonato: { select: { id: true, nome: true } }
        }
      }
    }
  });

  // Aggregate general statistics
  const totalGols = allStats.reduce((sum, s) => sum + s.gols, 0);
  const totalAssistencias = allStats.reduce((sum, s) => sum + s.assistencias, 0);
  const totalCartoesAmarelos = allStats.reduce((sum, s) => sum + s.cartoesAmarelos, 0);
  const totalCartoesVermelhos = allStats.reduce((sum, s) => sum + s.cartoesVermelhos, 0);
  const totalJogos = allStats.length;

  // Group by championship
  const statsByChampionship: { [key: number]: { nome: string; jogos: number; gols: number; assistencias: number } } = {};
  
  for (const stat of allStats) {
    const campId = stat.partida.campeonatoId;
    const campNome = stat.partida.campeonato.nome;
    
    if (!statsByChampionship[campId]) {
      statsByChampionship[campId] = { nome: campNome, jogos: 0, gols: 0, assistencias: 0 };
    }
    
    statsByChampionship[campId].jogos++;
    statsByChampionship[campId].gols += stat.gols;
    statsByChampionship[campId].assistencias += stat.assistencias;
  }

  const porCampeonato = Object.entries(statsByChampionship).map(([id, data]) => ({
    campeonatoId: parseInt(id),
    nomeCampeonato: data.nome,
    jogos: data.jogos,
    gols: data.gols,
    assistencias: data.assistencias
  }));

  return {
    jogador: {
      id: player.id,
      nome: player.nome,
      time: player.time
    },
    estatisticasGerais: {
      totalJogos,
      totalGols,
      totalAssistencias,
      cartoesAmarelos: totalCartoesAmarelos,
      cartoesVermelhos: totalCartoesVermelhos,
      mediaGolsPorJogo: totalJogos > 0 ? Math.round((totalGols / totalJogos) * 100) / 100 : 0
    },
    porCampeonato
  };
};

/**
 * Get team match history with pagination
 * GET /api/teams/:id/history
 */
export const getTeamHistory = async (timeId: number, limit: number = 10, offset: number = 0) => {
  const team = await prisma.time.findUnique({
    where: { id: timeId }
  });

  if (!team) {
    throw new Error('Time não encontrado');
  }

  // Get all finished matches for this team
  const matches = await prisma.partida.findMany({
    where: {
      status: 'finalizada',
      OR: [
        { timeCasaId: timeId },
        { timeVisitanteId: timeId }
      ]
    },
    include: {
      campeonato: { select: { nome: true } },
      timeCasa: { select: { id: true, nome: true } },
      timeVisitante: { select: { id: true, nome: true } }
    },
    orderBy: { dataHora: 'desc' },
    skip: offset,
    take: limit
  });

  // Get total count for pagination
  const totalMatches = await prisma.partida.count({
    where: {
      status: 'finalizada',
      OR: [
        { timeCasaId: timeId },
        { timeVisitanteId: timeId }
      ]
    }
  });

  // Calculate statistics
  let vitorias = 0, empates = 0, derrotas = 0, golsPro = 0, golsContra = 0;

  // Get all matches for stats calculation
  const allMatches = await prisma.partida.findMany({
    where: {
      status: 'finalizada',
      OR: [
        { timeCasaId: timeId },
        { timeVisitanteId: timeId }
      ]
    }
  });

  for (const match of allMatches) {
    const isHome = match.timeCasaId === timeId;
    const teamGoals = isHome ? (match.golsTimeCasa || 0) : (match.golsTimeVisitante || 0);
    const opponentGoals = isHome ? (match.golsTimeVisitante || 0) : (match.golsTimeCasa || 0);
    
    golsPro += teamGoals;
    golsContra += opponentGoals;
    
    if (teamGoals > opponentGoals) vitorias++;
    else if (teamGoals === opponentGoals) empates++;
    else derrotas++;
  }

  // Format history
  const historico = matches.map((match) => {
    const isHome = match.timeCasaId === timeId;
    const adversario = isHome ? match.timeVisitante : match.timeCasa;
    const placarTime = isHome ? match.golsTimeCasa : match.golsTimeVisitante;
    const placarAdversario = isHome ? match.golsTimeVisitante : match.golsTimeCasa;
    
    let resultado = 'empate';
    if ((placarTime || 0) > (placarAdversario || 0)) resultado = 'vitoria';
    else if ((placarTime || 0) < (placarAdversario || 0)) resultado = 'derrota';

    return {
      partidaId: match.id,
      data: match.dataHora.toISOString().split('T')[0],
      campeonato: match.campeonato.nome,
      adversario: adversario.nome,
      placarTime,
      placarAdversario,
      resultado,
      mandante: isHome
    };
  });

  return {
    time: {
      id: team.id,
      nome: team.nome
    },
    historico,
    estatisticas: {
      totalJogos: allMatches.length,
      vitorias,
      empates,
      derrotas,
      golsPro,
      golsContra,
      saldoGols: golsPro - golsContra
    },
    paginacao: {
      total: totalMatches,
      limit,
      offset,
      hasMore: offset + limit < totalMatches
    }
  };
};

/**
 * Get head-to-head confrontation between two teams
 * GET /api/teams/:id/vs/:id2
 */
export const getHeadToHead = async (timeId1: number, timeId2: number) => {
  const team1 = await prisma.time.findUnique({ where: { id: timeId1 } });
  const team2 = await prisma.time.findUnique({ where: { id: timeId2 } });

  if (!team1) throw new Error('Time 1 não encontrado');
  if (!team2) throw new Error('Time 2 não encontrado');

  // Get all finished matches between these teams
  const matches = await prisma.partida.findMany({
    where: {
      status: 'finalizada',
      OR: [
        { timeCasaId: timeId1, timeVisitanteId: timeId2 },
        { timeCasaId: timeId2, timeVisitanteId: timeId1 }
      ]
    },
    include: {
      campeonato: { select: { nome: true } }
    },
    orderBy: { dataHora: 'desc' }
  });

  let vitoriasTime1 = 0, vitoriasTime2 = 0, empates = 0;
  let golsTime1 = 0, golsTime2 = 0;

  const ultimasPartidas = matches.slice(0, 5).map((match) => {
    const team1IsHome = match.timeCasaId === timeId1;
    const placarTime1 = team1IsHome ? match.golsTimeCasa : match.golsTimeVisitante;
    const placarTime2 = team1IsHome ? match.golsTimeVisitante : match.golsTimeCasa;

    return {
      data: match.dataHora.toISOString().split('T')[0],
      campeonato: match.campeonato.nome,
      placarTime1,
      placarTime2,
      mandante: team1IsHome ? team1.nome : team2.nome
    };
  });

  for (const match of matches) {
    const team1IsHome = match.timeCasaId === timeId1;
    const team1Goals = team1IsHome ? (match.golsTimeCasa || 0) : (match.golsTimeVisitante || 0);
    const team2Goals = team1IsHome ? (match.golsTimeVisitante || 0) : (match.golsTimeCasa || 0);

    golsTime1 += team1Goals;
    golsTime2 += team2Goals;

    if (team1Goals > team2Goals) vitoriasTime1++;
    else if (team2Goals > team1Goals) vitoriasTime2++;
    else empates++;
  }

  return {
    time1: { id: team1.id, nome: team1.nome },
    time2: { id: team2.id, nome: team2.nome },
    confrontos: {
      total: matches.length,
      vitoriasTime1,
      empates,
      vitoriasTime2,
      golsTime1,
      golsTime2
    },
    ultimasPartidas
  };
};
