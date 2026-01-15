import prisma from '../../prisma/client';
import { bracketService } from '../bracket/bracket.service';

export const groupsService = {
  /**
   * Generate group names (Grupo A, Grupo B, etc.)
   */
  getGroupNames(numGroups: number): string[] {
    const names: string[] = [];
    for (let i = 0; i < numGroups; i++) {
      names.push(`Grupo ${String.fromCharCode(65 + i)}`);
    }
    return names;
  },

  /**
   * Validate group creation requirements
   */
  async validateGroupCreation(championshipId: number, userId: number, numGroups: number) {
    // Check if championship exists
    const championship = await prisma.campeonato.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new Error('Campeonato não encontrado');
    }

    // Check if user is the organizer
    if (championship.organizadorId !== userId) {
      throw new Error('Apenas o organizador pode criar os grupos');
    }

    // Check if championship type is misto
    if (championship.tipo !== 'misto') {
      throw new Error('Campeonato deve ser do tipo misto');
    }

    // Check if groups already exist
    const existingGroups = await prisma.grupo.findMany({
      where: { campeonatoId: championshipId },
    });

    if (existingGroups.length > 0) {
      throw new Error('Grupos já foram criados para este campeonato');
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

    // Check if number of teams is divisible by number of groups
    if (approvedTeams.length % numGroups !== 0) {
      throw new Error(`Número de times (${approvedTeams.length}) deve ser divisível pelo número de grupos (${numGroups})`);
    }

    return { championship, approvedTeams };
  },

  /**
   * Create groups for a misto championship
   */
  async createGroups(championshipId: number, userId: number, numGroups: number = 2) {
    const { championship, approvedTeams } = await this.validateGroupCreation(championshipId, userId, numGroups);

    const groupNames = this.getGroupNames(numGroups);
    const teamsPerGroup = approvedTeams.length / numGroups;

    // Shuffle teams for randomized distribution
    const shuffledTeams = [...approvedTeams].sort(() => Math.random() - 0.5);

    // Create groups and distribute teams in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const createdGroups: any[] = [];

      for (let i = 0; i < numGroups; i++) {
        // Create group
        const group = await tx.grupo.create({
          data: {
            campeonatoId: championshipId,
            nome: groupNames[i],
          },
        });

        // Assign teams to group
        const groupTeams = shuffledTeams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        for (const team of groupTeams) {
          await tx.inscricao.update({
            where: { id: team.id },
            data: { grupoId: group.id },
          });

          // Create initial classification entry for the team in this championship
          await tx.classificacao.upsert({
            where: {
              campeonatoId_timeId: {
                campeonatoId: championshipId,
                timeId: team.timeId,
              },
            },
            create: {
              campeonatoId: championshipId,
              timeId: team.timeId,
              pontos: 0,
              jogos: 0,
              vitorias: 0,
              empates: 0,
              derrotas: 0,
              golsPro: 0,
              golsContra: 0,
              saldoGols: 0,
            },
            update: {},
          });
        }

        // Create round-robin matches within the group
        const matchDate = new Date();
        matchDate.setDate(matchDate.getDate() + 7);
        let matchIndex = 0;

        for (let j = 0; j < groupTeams.length; j++) {
          for (let k = j + 1; k < groupTeams.length; k++) {
            await tx.partida.create({
              data: {
                campeonatoId: championshipId,
                grupoId: group.id,
                timeCasaId: groupTeams[j].timeId,
                timeVisitanteId: groupTeams[k].timeId,
                rodada: Math.floor(matchIndex / 2) + 1,
                dataHora: new Date(matchDate.getTime() + matchIndex * 86400000), // One day apart
                local: 'A definir',
                status: 'agendada',
              },
            });
            matchIndex++;
          }
        }

        createdGroups.push({
          ...group,
          times: groupTeams.map((t) => t.time),
        });
      }

      return { grupos: createdGroups };
    });

    return result;
  },

  /**
   * Get groups for a championship
   */
  async getGroups(championshipId: number) {
    const championship = await prisma.campeonato.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new Error('Campeonato não encontrado');
    }

    if (championship.tipo !== 'misto') {
      throw new Error('Campeonato não é do tipo misto');
    }

    const grupos = await prisma.grupo.findMany({
      where: { campeonatoId: championshipId },
      include: {
        inscricoes: {
          include: {
            time: {
              select: { id: true, nome: true, escudo: true },
            },
          },
        },
        partidas: {
          include: {
            timeCasa: { select: { id: true, nome: true } },
            timeVisitante: { select: { id: true, nome: true } },
          },
          orderBy: { rodada: 'asc' },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return {
      campeonato: {
        id: championship.id,
        nome: championship.nome,
        tipo: championship.tipo,
      },
      grupos: grupos.map((g) => ({
        id: g.id,
        nome: g.nome,
        times: g.inscricoes.map((i) => i.time),
        partidas: g.partidas.map((p) => ({
          id: p.id,
          timeCasa: p.timeCasa,
          timeVisitante: p.timeVisitante,
          golsTimeCasa: p.golsTimeCasa,
          golsTimeVisitante: p.golsTimeVisitante,
          status: p.status,
          rodada: p.rodada,
        })),
      })),
    };
  },

  /**
   * Get standings for a specific group
   */
  async getGroupStandings(championshipId: number, groupId: number) {
    const grupo = await prisma.grupo.findMany({
      where: {
        id: groupId,
        campeonatoId: championshipId,
      },
      include: {
        inscricoes: {
          include: {
            time: { select: { id: true, nome: true, escudo: true } },
          },
        },
      },
    });

    if (grupo.length === 0) {
      throw new Error('Grupo não encontrado');
    }

    const group = grupo[0];
    const teamIds = group.inscricoes.map((i) => i.timeId);

    // Get classification for teams in this group
    const classificacoes = await prisma.classificacao.findMany({
      where: {
        campeonatoId: championshipId,
        timeId: { in: teamIds },
      },
      orderBy: [
        { pontos: 'desc' },
        { saldoGols: 'desc' },
        { golsPro: 'desc' },
      ],
    });

    // Map teams with classification
    const standings = classificacoes.map((c) => {
      const inscricao = group.inscricoes.find((i) => i.timeId === c.timeId);
      return {
        posicao: 0, // Will be set below
        time: inscricao?.time,
        pontos: c.pontos,
        jogos: c.jogos,
        vitorias: c.vitorias,
        empates: c.empates,
        derrotas: c.derrotas,
        golsPro: c.golsPro,
        golsContra: c.golsContra,
        saldoGols: c.saldoGols,
      };
    });

    // Set positions
    standings.forEach((s, idx) => {
      s.posicao = idx + 1;
    });

    return {
      grupo: {
        id: group.id,
        nome: group.nome,
      },
      classificacao: standings,
    };
  },

  /**
   * Create knockout phase from group stage qualifiers
   */
  async createKnockoutPhase(championshipId: number, userId: number, qualifiersPerGroup: number = 2) {
    const championship = await prisma.campeonato.findUnique({
      where: { id: championshipId },
    });

    if (!championship) {
      throw new Error('Campeonato não encontrado');
    }

    if (championship.organizadorId !== userId) {
      throw new Error('Apenas o organizador pode criar a fase mata-mata');
    }

    if (championship.tipo !== 'misto') {
      throw new Error('Campeonato deve ser do tipo misto');
    }

    // Check if knockout phase already exists
    const existingPhases = await prisma.fase.findMany({
      where: { campeonatoId: championshipId },
    });

    if (existingPhases.length > 0) {
      throw new Error('Fase mata-mata já foi criada');
    }

    // Get groups
    const grupos = await prisma.grupo.findMany({
      where: { campeonatoId: championshipId },
      include: {
        inscricoes: {
          include: { time: true },
        },
      },
      orderBy: { nome: 'asc' },
    });

    if (grupos.length === 0) {
      throw new Error('Fase de grupos ainda não foi criada');
    }

    // Check if all group matches are finished
    const unfinishedMatches = await prisma.partida.findMany({
      where: {
        campeonatoId: championshipId,
        grupoId: { not: null },
        status: { not: 'finalizada' },
      },
    });

    if (unfinishedMatches.length > 0) {
      throw new Error('Todas as partidas da fase de grupos devem estar finalizadas');
    }

    // Get qualifiers from each group
    const qualifiers: { timeId: number; groupName: string; position: number; time: any }[] = [];

    for (const grupo of grupos) {
      const standings = await this.getGroupStandings(championshipId, grupo.id);
      const groupQualifiers = standings.classificacao.slice(0, qualifiersPerGroup);
      
      groupQualifiers.forEach((q, idx) => {
        if (q.time) {
          qualifiers.push({
            timeId: q.time.id,
            groupName: grupo.nome,
            position: idx + 1,
            time: q.time,
          });
        }
      });
    }

    const totalQualifiers = qualifiers.length;
    if (!bracketService.isPowerOfTwo(totalQualifiers)) {
      throw new Error(`Número de classificados (${totalQualifiers}) deve ser potência de 2`);
    }

    // Create knockout bracket
    const phaseNames = bracketService.getPhaseNames(totalQualifiers);

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

      // Create first round matches with crossed pairings (1st of A vs 2nd of B, etc.)
      const firstPhase = createdPhases[0];
      const firstRoundMatches: any[] = [];
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 7);

      // Create crossed pairings
      const numGroups = grupos.length;
      for (let i = 0; i < numGroups; i++) {
        const nextGroupIdx = (i + 1) % numGroups;
        
        // 1st of group i vs 2nd of next group (crossed)
        const firstPlace = qualifiers.find((q) => q.groupName === grupos[i].nome && q.position === 1);
        const secondPlace = qualifiers.find((q) => q.groupName === grupos[nextGroupIdx].nome && q.position === 2);

        if (firstPlace && secondPlace) {
          const match = await tx.partida.create({
            data: {
              campeonatoId: championshipId,
              faseId: firstPhase.id,
              timeCasaId: firstPlace.timeId,
              timeVisitanteId: secondPlace.timeId,
              rodada: 1,
              dataHora: new Date(matchDate.getTime() + i * 3600000),
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
      }

      // Create placeholder matches for subsequent phases
      for (let phaseIndex = 1; phaseIndex < createdPhases.length; phaseIndex++) {
        const phase = createdPhases[phaseIndex];
        const matchesInPhase = totalQualifiers / Math.pow(2, phaseIndex + 1);
        const phaseDate = new Date(matchDate);
        phaseDate.setDate(phaseDate.getDate() + phaseIndex * 7);

        for (let i = 0; i < matchesInPhase; i++) {
          // Placeholder with first qualifiers (will be updated when matches are decided)
          await tx.partida.create({
            data: {
              campeonatoId: championshipId,
              faseId: phase.id,
              timeCasaId: qualifiers[0].timeId,
              timeVisitanteId: qualifiers[1].timeId,
              rodada: phaseIndex + 1,
              dataHora: new Date(phaseDate.getTime() + i * 3600000),
              local: 'A definir',
              status: 'agendada',
            },
          });
        }
      }

      return { fases: createdPhases, partidasIniciais: firstRoundMatches };
    });

    return result;
  },
};
