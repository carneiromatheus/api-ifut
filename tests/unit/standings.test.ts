import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  createTestPlayer,
  createTestMatch,
  prisma 
} from '../helpers/testUtils';
import * as standingsService from '../../src/modules/standings/standings.service';
import * as resultsService from '../../src/modules/results/results.service';

describe('Standings Module', () => {
  let organizer: any;
  let championship: any;
  let teamA: any;
  let teamB: any;
  let teamC: any;
  let playerA: any;
  let playerB: any;
  let playerC: any;

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
    teamC = await createTestTeam(organizer.id, { nome: 'Time C' });

    await createApprovedRegistration(championship.id, teamA.id);
    await createApprovedRegistration(championship.id, teamB.id);
    await createApprovedRegistration(championship.id, teamC.id);

    // Create players
    playerA = await createTestPlayer(teamA.id, { nome: 'Jogador A', numeroCamisa: 10, documento: '11111111111' });
    playerB = await createTestPlayer(teamB.id, { nome: 'Jogador B', numeroCamisa: 7, documento: '22222222222' });
    playerC = await createTestPlayer(teamC.id, { nome: 'Jogador C', numeroCamisa: 9, documento: '33333333333' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Calculate Points', () => {
    it('should calculate 3 points for victory', () => {
      const points = standingsService.calculatePoints(2, 1);
      expect(points.homePoints).toBe(3);
      expect(points.awayPoints).toBe(0);
      expect(points.homeResult).toBe('vitoria');
      expect(points.awayResult).toBe('derrota');
    });

    it('should calculate 1 point each for draw', () => {
      const points = standingsService.calculatePoints(1, 1);
      expect(points.homePoints).toBe(1);
      expect(points.awayPoints).toBe(1);
      expect(points.homeResult).toBe('empate');
      expect(points.awayResult).toBe('empate');
    });

    it('should calculate 0 points for defeat', () => {
      const points = standingsService.calculatePoints(0, 3);
      expect(points.homePoints).toBe(0);
      expect(points.awayPoints).toBe(3);
      expect(points.homeResult).toBe('derrota');
      expect(points.awayResult).toBe('vitoria');
    });
  });

  describe('Get Standings', () => {
    it('should return standings sorted by points', async () => {
      // Register results
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await resultsService.registerResult(match1.id, {
        golsTimeCasa: 2,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      const standings = await standingsService.getStandings(championship.id);

      expect(standings).toHaveLength(3);
      expect(standings[0].timeId).toBe(teamA.id);
      expect(standings[0].pontos).toBe(3);
      expect(standings[0].posicao).toBe(1);
    });

    it('should sort by victories when points are equal', async () => {
      // Team A wins 1-0 against B
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await resultsService.registerResult(match1.id, {
        golsTimeCasa: 1,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      // Team C wins 3-0 against B (more goal difference but same points as A)
      const match2 = await createTestMatch(championship.id, teamC.id, teamB.id, { rodada: 2 });
      await resultsService.registerResult(match2.id, {
        golsTimeCasa: 3,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerC.id, timeId: teamC.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerC.id, gols: 3, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      const standings = await standingsService.getStandings(championship.id);

      // Both A and C have 3 points and 1 victory
      // C should be first due to better goal difference (3 vs 1)
      expect(standings[0].timeId).toBe(teamC.id);
      expect(standings[1].timeId).toBe(teamA.id);
    });

    it('should sort by goal difference when points and victories are equal', async () => {
      // Team A wins 3-0 against B
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await resultsService.registerResult(match1.id, {
        golsTimeCasa: 3,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA.id, gols: 3, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      // Team C wins 1-0 against B
      const match2 = await createTestMatch(championship.id, teamC.id, teamB.id, { rodada: 2 });
      await resultsService.registerResult(match2.id, {
        golsTimeCasa: 1,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerC.id, timeId: teamC.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerC.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      const standings = await standingsService.getStandings(championship.id);

      // Both have 3 points, 1 victory, but A has better goal difference
      expect(standings[0].timeId).toBe(teamA.id);
      expect(standings[0].saldoGols).toBe(3);
      expect(standings[1].saldoGols).toBe(1);
    });

    it('should return empty array for non-existent championship', async () => {
      const standings = await standingsService.getStandings(99999);
      expect(standings).toHaveLength(0);
    });
  });

  describe('Update Standings After Result (RN14)', () => {
    it('should automatically update standings after result', async () => {
      const match = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      
      // Register result
      await resultsService.registerResult(match.id, {
        golsTimeCasa: 2,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      }, organizer.id);

      const standings = await standingsService.getStandings(championship.id);

      // Find team A and B standings
      const teamAStanding = standings.find((s: any) => s.timeId === teamA.id);
      const teamBStanding = standings.find((s: any) => s.timeId === teamB.id);

      expect(teamAStanding?.pontos).toBe(3);
      expect(teamAStanding?.vitorias).toBe(1);
      expect(teamAStanding?.jogos).toBe(1);
      expect(teamAStanding?.golsPro).toBe(2);
      expect(teamAStanding?.golsContra).toBe(1);
      expect(teamAStanding?.saldoGols).toBe(1);

      expect(teamBStanding?.pontos).toBe(0);
      expect(teamBStanding?.derrotas).toBe(1);
      expect(teamBStanding?.jogos).toBe(1);
    });
  });
});
