import prisma from '../../prisma/client';

export const bracketService = {
  /**
   * Check if a number is a power of 2
   */
  isPowerOfTwo(n: number): boolean {
    return n > 0 && (n & (n - 1)) === 0;
  },

  /**
   * Get phase names based on number of teams
   */
  getPhaseNames(numTeams: number): string[] {
    const phases: string[] = [];
    let teamsRemaining = numTeams;

    while (teamsRemaining > 1) {
      if (teamsRemaining === 2) {
        phases.push('Final');
      } else if (teamsRemaining === 4) {
        phases.push('Semi-final');
      } else if (teamsRemaining === 8) {
        phases.push('Quartas de final');
      } else if (teamsRemaining === 16) {
        phases.push('Oitavas de final');
      } else {
        phases.push(`${teamsRemaining}-avos de final`);
      }
      teamsRemaining = teamsRemaining / 2;
    }

    // Return in order from first round to final
    return phases;
  },

  /**
   * Validate bracket creation requirements
   */
  async validateBracketCreation(championshipId: number, userId: number) {
    // Check if championship exists
    const championship = await prisma.campeonato.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new Error('Campeonato não encontrado');
    }

    // Check if user is the organizer
    if (championship.organizadorId !== userId) {
      throw new Error('Apenas o organizador pode criar o chaveamento');
    }

    // Check if championship type is mata_mata
    if (championship.tipo !== 'mata_mata') {
      throw new Error('Campeonato deve ser do tipo mata-mata');
    }

    // Check if bracket already exists
    const existingPhases = await prisma.fase.findMany({
      where: { campeonatoId: championshipId },
    });

    if (existingPhases.length > 0) {
      throw new Error('Chaveamento já foi criado para este campeonato');
    }

    // Get approved teams
    const approvedTeams = await prisma.inscricao.findMany({
      where: {
        campeonatoId: championshipId,
        status: 'aprovada',
      },
      include: {
        time: true,
      },
    });

    // Check minimum teams
    if (approvedTeams.length < 4) {
      throw new Error('Mínimo de 4 times aprovados necessário');
    }

    // Check if number of teams is power of 2
    if (!this.isPowerOfTwo(approvedTeams.length)) {
      throw new Error('Número de times deve ser potência de 2 (4, 8, 16, 32)');
    }

    return { championship, approvedTeams };
  },

  /**
   * Create bracket for a mata-mata championship
   */
  async createBracket(championshipId: number, userId: number) {
    const { championship, approvedTeams } = await this.validateBracketCreation(championshipId, userId);

    const numTeams = approvedTeams.length;
    const phaseNames = this.getPhaseNames(numTeams);

    // Shuffle teams for randomized bracket
    const shuffledTeams = [...approvedTeams].sort(() => Math.random() - 0.5);

    // Create phases and matches in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create phases
      const createdPhases: { id: number; nome: string; ordem: number }[] = [];
      for (let i = 0; i < phaseNames.length; i++) {
        const phase = await tx.fase.create({
          data: {
            campeonatoId: championshipId,
            nome: phaseNames[i],
            ordem: i + 1,
          },
        });
        createdPhases.push(phase);
      }

      // Create first round matches with shuffled teams
      const firstPhase = createdPhases[0];
      const firstRoundMatches = [];
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 7); // Schedule for next week

      for (let i = 0; i < shuffledTeams.length; i += 2) {
        const match = await tx.partida.create({
          data: {
            campeonatoId: championshipId,
            faseId: firstPhase.id,
            timeCasaId: shuffledTeams[i].timeId,
            timeVisitanteId: shuffledTeams[i + 1].timeId,
            rodada: 1,
            dataHora: new Date(matchDate.getTime() + i * 3600000), // Stagger by 1 hour
            local: 'A definir',
            status: 'agendada',
          },
          include: {
            timeCasa: true,
            timeVisitante: true,
          },
        });
        firstRoundMatches.push(match);
      }

      // Create placeholder matches for subsequent phases
      const allMatches: any[] = [...firstRoundMatches];
      for (let phaseIndex = 1; phaseIndex < createdPhases.length; phaseIndex++) {
        const phase = createdPhases[phaseIndex];
        const matchesInPhase = numTeams / Math.pow(2, phaseIndex + 1);
        const phaseDate = new Date(matchDate);
        phaseDate.setDate(phaseDate.getDate() + phaseIndex * 7);

        for (let i = 0; i < matchesInPhase; i++) {
          // Create placeholder match (teams TBD)
          const match = await tx.partida.create({
            data: {
              campeonatoId: championshipId,
              faseId: phase.id,
              timeCasaId: shuffledTeams[0].timeId, // Placeholder
              timeVisitanteId: shuffledTeams[1].timeId, // Placeholder
              rodada: phaseIndex + 1,
              dataHora: new Date(phaseDate.getTime() + i * 3600000),
              local: 'A definir',
              status: 'agendada',
            },
            include: {
              timeCasa: true,
              timeVisitante: true,
            },
          });
          allMatches.push(match);
        }
      }

      return { fases: createdPhases, partidas: allMatches };
    });

    return result;
  },

  /**
   * Get bracket for a championship
   */
  async getBracket(championshipId: number) {
    const championship = await prisma.campeonato.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new Error('Campeonato não encontrado');
    }

    if (championship.tipo !== 'mata_mata') {
      throw new Error('Campeonato não é do tipo mata-mata');
    }

    const fases = await prisma.fase.findMany({
      where: { campeonatoId: championshipId },
      orderBy: { ordem: 'asc' },
      include: {
        partidas: {
          include: {
            timeCasa: {
              select: { id: true, nome: true, escudo: true },
            },
            timeVisitante: {
              select: { id: true, nome: true, escudo: true },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    return {
      campeonato: {
        id: championship.id,
        nome: championship.nome,
        tipo: championship.tipo,
      },
      fases: fases.map((fase) => ({
        id: fase.id,
        nome: fase.nome,
        ordem: fase.ordem,
        partidas: fase.partidas.map((partida) => ({
          id: partida.id,
          timeCasa: partida.timeCasa,
          timeVisitante: partida.timeVisitante,
          golsTimeCasa: partida.golsTimeCasa,
          golsTimeVisitante: partida.golsTimeVisitante,
          status: partida.status,
          dataHora: partida.dataHora,
          vencedor: this.getMatchWinner(partida),
        })),
      })),
    };
  },

  /**
   * Determine match winner
   */
  getMatchWinner(partida: {
    golsTimeCasa: number | null;
    golsTimeVisitante: number | null;
    status: string;
    timeCasa?: { id: number; nome: string } | null;
    timeVisitante?: { id: number; nome: string } | null;
  }) {
    if (partida.status !== 'finalizada' || partida.golsTimeCasa === null || partida.golsTimeVisitante === null) {
      return null;
    }

    if (partida.golsTimeCasa > partida.golsTimeVisitante) {
      return partida.timeCasa || { id: 0, nome: 'Time Casa' };
    } else if (partida.golsTimeVisitante > partida.golsTimeCasa) {
      return partida.timeVisitante || { id: 0, nome: 'Time Visitante' };
    }

    // Em caso de empate em mata-mata, precisa de critério de desempate
    // Por simplicidade, retorna time da casa como vencedor
    return partida.timeCasa || { id: 0, nome: 'Time Casa' };
  },

  /**
   * Advance winner to next phase
   */
  async advanceWinner(matchId: number) {
    const match = await prisma.partida.findUnique({
      where: { id: matchId },
      include: {
        fase: true,
        timeCasa: true,
        timeVisitante: true,
        campeonato: {
          include: {
            fases: {
              orderBy: { ordem: 'asc' },
            },
          },
        },
      },
    });

    if (!match || !match.fase) {
      throw new Error('Partida não encontrada ou não é de mata-mata');
    }

    if (match.status !== 'finalizada') {
      throw new Error('Partida ainda não foi finalizada');
    }

    const winner = this.getMatchWinner({
      golsTimeCasa: match.golsTimeCasa,
      golsTimeVisitante: match.golsTimeVisitante,
      status: match.status,
      timeCasa: match.timeCasa,
      timeVisitante: match.timeVisitante,
    });

    if (!winner) {
      throw new Error('Não foi possível determinar o vencedor');
    }

    // Find next phase
    const currentPhaseOrder = match.fase.ordem;
    const nextPhase = match.campeonato.fases.find((f) => f.ordem === currentPhaseOrder + 1);

    if (!nextPhase) {
      // This is the final - championship is complete
      return { message: 'Campeão definido!', campeao: winner };
    }

    // Find placeholder match in next phase and update with winner
    // Logic: Match 1 and 2 of phase N feed into match 1 of phase N+1, etc.
    const currentPhaseMatches = await prisma.partida.findMany({
      where: { faseId: match.fase.id },
      orderBy: { id: 'asc' },
    });

    const matchIndex = currentPhaseMatches.findIndex((m) => m.id === matchId);
    const nextMatchIndex = Math.floor(matchIndex / 2);

    const nextPhaseMatches = await prisma.partida.findMany({
      where: { faseId: nextPhase.id },
      orderBy: { id: 'asc' },
    });

    if (nextMatchIndex < nextPhaseMatches.length) {
      const nextMatch = nextPhaseMatches[nextMatchIndex];
      const isFirstOfPair = matchIndex % 2 === 0;

      await prisma.partida.update({
        where: { id: nextMatch.id },
        data: isFirstOfPair
          ? { timeCasaId: winner.id }
          : { timeVisitanteId: winner.id },
      });
    }

    return { message: 'Vencedor avançou para próxima fase', proximaFase: nextPhase.nome };
  },
};
