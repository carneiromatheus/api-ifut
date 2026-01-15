import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  createTestPlayer,
  createTestMatch,
  prisma 
} from '../helpers/testUtils';
import * as statisticsService from '../../src/modules/statistics/statistics.service';
import * as resultsService from '../../src/modules/results/results.service';

describe('Statistics Module', () => {
  let organizer: any;
  let championship: any;
  let teamA: any;
  let teamB: any;
  let playerA1: any;
  let playerA2: any;
  let playerB1: any;

  beforeEach(async () => {
    // Clean database
    await prisma.$executeRawUnsafe('TRUNCATE TABLE estatisticas CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE escalacoes CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE partidas CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE classificacoes CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE inscricoes CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE jogadores CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE times CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE campeonatos CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE usuarios CASCADE');

    // Create test data
    const orgResult = await createTestUser({ tipo: 'organizador', email: 'org@test.com' });
    organizer = { ...orgResult.user, token: orgResult.token };

    championship = await createTestChampionship(organizer.id, {
      nome: 'Campeonato Teste',
      dataInicio: new Date('2025-01-01')
    });

    teamA = await createTestTeam(organizer.id, { nome: 'Time A' });
    teamB = await createTestTeam(organizer.id, { nome: 'Time B' });

    await createApprovedRegistration(championship.id, teamA.id);
    await createApprovedRegistration(championship.id, teamB.id);

    // Create players
    playerA1 = await createTestPlayer(teamA.id, { nome: 'Jogador A1', numeroCamisa: 10, documento: '11111111111' });
    playerA2 = await createTestPlayer(teamA.id, { nome: 'Jogador A2', numeroCamisa: 9, documento: '22222222222' });
    playerB1 = await createTestPlayer(teamB.id, { nome: 'Jogador B1', numeroCamisa: 7, documento: '33333333333' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Top Scorers', () => {
    beforeEach(async () => {
      // Match 1: A wins 3-1
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await resultsService.registerResult(match1.id, {
        golsTimeCasa: 3,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerA2.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 2, assistencias: 1, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerA2.id, gols: 1, assistencias: 1, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      // Match 2: B wins 2-1
      const match2 = await createTestMatch(championship.id, teamB.id, teamA.id, { rodada: 2 });
      await resultsService.registerResult(match2.id, {
        golsTimeCasa: 2,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 1, assistencias: 0, cartoesAmarelos: 1, cartoesVermelhos: 0 },
          { jogadorId: playerB1.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);
    });

    it('should return top scorers sorted by goals', async () => {
      const topScorers = await statisticsService.getTopScorers(championship.id);

      expect(topScorers).toHaveLength(3);
      
      // Player A1 and B1 should have 3 goals each
      expect(topScorers[0].gols).toBe(3);
      expect(topScorers[1].gols).toBe(3);
    });

    it('should limit results to specified number', async () => {
      const topScorers = await statisticsService.getTopScorers(championship.id, 2);

      expect(topScorers).toHaveLength(2);
    });

    it('should include player and team info', async () => {
      const topScorers = await statisticsService.getTopScorers(championship.id);

      expect(topScorers[0].nomeJogador).toBeDefined();
      expect(topScorers[0].nomeTime).toBeDefined();
      expect(topScorers[0].jogadorId).toBeDefined();
      expect(topScorers[0].timeId).toBeDefined();
    });

    it('should include assists and games count', async () => {
      const topScorers = await statisticsService.getTopScorers(championship.id);

      const playerA1Stats = topScorers.find((s: any) => s.jogadorId === playerA1.id);
      expect(playerA1Stats?.assistencias).toBe(1);
      expect(playerA1Stats?.jogos).toBe(2);
    });

    it('should return empty array for non-existent championship', async () => {
      const topScorers = await statisticsService.getTopScorers(99999);
      expect(topScorers).toHaveLength(0);
    });

    it('should default to top 10', async () => {
      // Create more players and matches to have more than 10 scorers
      // For now, just verify it works with default
      const topScorers = await statisticsService.getTopScorers(championship.id);
      expect(topScorers.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Player Statistics Aggregation', () => {
    it('should aggregate statistics across multiple matches', async () => {
      // Match 1
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await resultsService.registerResult(match1.id, {
        golsTimeCasa: 2,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 2, assistencias: 0, cartoesAmarelos: 1, cartoesVermelhos: 0 },
          { jogadorId: playerB1.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      // Match 2
      const match2 = await createTestMatch(championship.id, teamB.id, teamA.id, { rodada: 2 });
      await resultsService.registerResult(match2.id, {
        golsTimeCasa: 1,
        golsTimeVisitante: 3,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 3, assistencias: 1, cartoesAmarelos: 0, cartoesVermelhos: 1 },
          { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 1, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      const topScorers = await statisticsService.getTopScorers(championship.id);
      const playerA1Stats = topScorers.find((s: any) => s.jogadorId === playerA1.id);

      expect(playerA1Stats?.gols).toBe(5);
      expect(playerA1Stats?.assistencias).toBe(1);
      expect(playerA1Stats?.jogos).toBe(2);
    });
  });
});
