import prisma from '../../prisma/client';

type GameResult = 'vitoria' | 'empate' | 'derrota';

interface PointsResult {
  homePoints: number;
  awayPoints: number;
  homeResult: GameResult;
  awayResult: GameResult;
}

// Calculate points based on match result
export const calculatePoints = (homeGoals: number, awayGoals: number): PointsResult => {
  if (homeGoals > awayGoals) {
    return {
      homePoints: 3,
      awayPoints: 0,
      homeResult: 'vitoria',
      awayResult: 'derrota'
    };
  } else if (homeGoals < awayGoals) {
    return {
      homePoints: 0,
      awayPoints: 3,
      homeResult: 'derrota',
      awayResult: 'vitoria'
    };
  } else {
    return {
      homePoints: 1,
      awayPoints: 1,
      homeResult: 'empate',
      awayResult: 'empate'
    };
  }
};

// RN14: Update standings automatically after each result
export const updateStandings = async (
  campeonatoId: number,
  homeTeamId: number,
  awayTeamId: number,
  homeGoals: number,
  awayGoals: number
) => {
  const { homePoints, awayPoints, homeResult, awayResult } = calculatePoints(homeGoals, awayGoals);

  // Update home team classification
  await prisma.classificacao.update({
    where: {
      campeonatoId_timeId: { campeonatoId, timeId: homeTeamId }
    },
    data: {
      pontos: { increment: homePoints },
      jogos: { increment: 1 },
      vitorias: { increment: homeResult === 'vitoria' ? 1 : 0 },
      empates: { increment: homeResult === 'empate' ? 1 : 0 },
      derrotas: { increment: homeResult === 'derrota' ? 1 : 0 },
      golsPro: { increment: homeGoals },
      golsContra: { increment: awayGoals },
      saldoGols: { increment: homeGoals - awayGoals }
    }
  });

  // Update away team classification
  await prisma.classificacao.update({
    where: {
      campeonatoId_timeId: { campeonatoId, timeId: awayTeamId }
    },
    data: {
      pontos: { increment: awayPoints },
      jogos: { increment: 1 },
      vitorias: { increment: awayResult === 'vitoria' ? 1 : 0 },
      empates: { increment: awayResult === 'empate' ? 1 : 0 },
      derrotas: { increment: awayResult === 'derrota' ? 1 : 0 },
      golsPro: { increment: awayGoals },
      golsContra: { increment: homeGoals },
      saldoGols: { increment: awayGoals - homeGoals }
    }
  });
};

// Get standings with tiebreaker criteria:
// 1. Points
// 2. Victories
// 3. Goal difference
// 4. Goals scored
export const getStandings = async (campeonatoId: number) => {
  const standings = await prisma.classificacao.findMany({
    where: { campeonatoId },
    include: {
      time: {
        select: { id: true, nome: true, escudo: true }
      }
    },
    orderBy: [
      { pontos: 'desc' },
      { vitorias: 'desc' },
      { saldoGols: 'desc' },
      { golsPro: 'desc' }
    ]
  });

  // Add position number
  return standings.map((standing, index) => ({
    posicao: index + 1,
    timeId: standing.timeId,
    nomeTime: standing.time.nome,
    escudo: standing.time.escudo,
    pontos: standing.pontos,
    jogos: standing.jogos,
    vitorias: standing.vitorias,
    empates: standing.empates,
    derrotas: standing.derrotas,
    golsPro: standing.golsPro,
    golsContra: standing.golsContra,
    saldoGols: standing.saldoGols
  }));
};
