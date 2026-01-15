import prisma from '../../prisma/client';
import * as standingsService from '../standings/standings.service';

interface EscalacaoData {
  jogadorId: number;
  timeId: number;
  titular: boolean;
}

interface EstatisticaData {
  jogadorId: number;
  gols: number;
  assistencias: number;
  cartoesAmarelos: number;
  cartoesVermelhos: number;
}

interface RegisterResultData {
  golsTimeCasa: number;
  golsTimeVisitante: number;
  escalacoes: EscalacaoData[];
  estatisticas: EstatisticaData[];
}

// RN13: Apenas organizador dono pode registrar resultados
export const registerResult = async (matchId: number, data: RegisterResultData, userId: number) => {
  const { golsTimeCasa, golsTimeVisitante, escalacoes, estatisticas } = data;

  // Get match with championship info
  const match = await prisma.partida.findUnique({
    where: { id: matchId },
    include: {
      campeonato: true,
      timeCasa: true,
      timeVisitante: true
    }
  });

  if (!match) {
    throw new Error('Partida não encontrada');
  }

  // RN13: Validate user is the organizer
  if (match.campeonato.organizadorId !== userId) {
    throw new Error('Apenas o organizador do campeonato pode registrar resultados');
  }

  // Validate match status
  if (!['agendada', 'em_andamento'].includes(match.status)) {
    throw new Error('Partida não está em status válido para registro de resultado');
  }

  // RN16: Validate no duplicate players in lineup
  const playerIds = escalacoes.map(e => e.jogadorId);
  const uniquePlayerIds = new Set(playerIds);
  if (playerIds.length !== uniquePlayerIds.size) {
    throw new Error('Jogador não pode estar duas vezes na escalação');
  }

  // Validate players belong to their teams
  for (const escalacao of escalacoes) {
    const player = await prisma.jogador.findUnique({
      where: { id: escalacao.jogadorId }
    });
    
    if (!player) {
      throw new Error(`Jogador ${escalacao.jogadorId} não encontrado`);
    }

    if (player.timeId !== escalacao.timeId) {
      throw new Error('Jogador não pertence ao time indicado');
    }
  }

  // Validate cards limits
  for (const stat of estatisticas) {
    if (stat.cartoesAmarelos < 0 || stat.cartoesAmarelos > 2) {
      throw new Error('Cartões amarelos devem ser entre 0 e 2');
    }
    if (stat.cartoesVermelhos < 0 || stat.cartoesVermelhos > 1) {
      throw new Error('Cartões vermelhos devem ser entre 0 e 1');
    }
  }

  // RN15: Validate goals sum matches score
  const homeGoals = estatisticas
    .filter(s => {
      const player = escalacoes.find(e => e.jogadorId === s.jogadorId);
      return player && player.timeId === match.timeCasaId;
    })
    .reduce((sum, s) => sum + s.gols, 0);

  const awayGoals = estatisticas
    .filter(s => {
      const player = escalacoes.find(e => e.jogadorId === s.jogadorId);
      return player && player.timeId === match.timeVisitanteId;
    })
    .reduce((sum, s) => sum + s.gols, 0);

  if (homeGoals !== golsTimeCasa) {
    throw new Error(`Soma de gols individuais do time da casa (${homeGoals}) não corresponde ao placar (${golsTimeCasa})`);
  }

  if (awayGoals !== golsTimeVisitante) {
    throw new Error(`Soma de gols individuais do time visitante (${awayGoals}) não corresponde ao placar (${golsTimeVisitante})`);
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update match with result
    const updatedMatch = await tx.partida.update({
      where: { id: matchId },
      data: {
        golsTimeCasa,
        golsTimeVisitante,
        status: 'finalizada'
      }
    });

    // Create escalacoes
    if (escalacoes.length > 0) {
      await tx.escalacao.createMany({
        data: escalacoes.map(e => ({
          partidaId: matchId,
          jogadorId: e.jogadorId,
          timeId: e.timeId,
          titular: e.titular
        }))
      });
    }

    // Create estatisticas
    if (estatisticas.length > 0) {
      await tx.estatistica.createMany({
        data: estatisticas.map(s => ({
          partidaId: matchId,
          jogadorId: s.jogadorId,
          gols: s.gols,
          assistencias: s.assistencias,
          cartoesAmarelos: s.cartoesAmarelos,
          cartoesVermelhos: s.cartoesVermelhos
        }))
      });
    }

    return updatedMatch;
  });

  // RN14: Update standings automatically after result
  await standingsService.updateStandings(match.campeonatoId, match.timeCasaId, match.timeVisitanteId, golsTimeCasa, golsTimeVisitante);

  return result;
};
