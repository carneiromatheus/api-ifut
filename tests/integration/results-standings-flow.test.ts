import request from 'supertest';
import app from '../../src/app';
import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  createTestPlayer,
  createTestMatch,
  prisma 
} from '../helpers/testUtils';

describe('Results & Standings Flow Integration Tests', () => {
  let organizer: any;
  let organizerToken: string;
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
    organizer = orgResult.user;
    organizerToken = orgResult.token;

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

    playerA = await createTestPlayer(teamA.id, { nome: 'Jogador A', documento: '11111111111' });
    playerB = await createTestPlayer(teamB.id, { nome: 'Jogador B', documento: '22222222222' });
    playerC = await createTestPlayer(teamC.id, { nome: 'Jogador C', documento: '33333333333' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complete Results & Standings Flow', () => {
    it('should register result -> update standings -> verify classification', async () => {
      // Step 1: Create match
      const match = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });

      // Step 2: Register result
      const resultResponse = await request(app)
        .patch(`/api/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          golsTimeCasa: 3,
          golsTimeVisitante: 1,
          escalacoes: [
            { jogadorId: playerA.id, timeId: teamA.id, titular: true },
            { jogadorId: playerB.id, timeId: teamB.id, titular: true }
          ],
          estatisticas: [
            { jogadorId: playerA.id, gols: 3, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerB.id, gols: 1, assistencias: 0, cartoesAmarelos: 1, cartoesVermelhos: 0 }
          ]
        });

      expect(resultResponse.status).toBe(200);
      expect(resultResponse.body.data.golsTimeCasa).toBe(3);
      expect(resultResponse.body.data.golsTimeVisitante).toBe(1);
      expect(resultResponse.body.data.status).toBe('finalizada');

      // Step 3: Verify standings
      const standingsResponse = await request(app)
        .get(`/api/championships/${championship.id}/standings`);

      expect(standingsResponse.status).toBe(200);
      const standings = standingsResponse.body.data.classificacao;

      // Team A should be first with 3 points
      const teamAStanding = standings.find((s: any) => s.timeId === teamA.id);
      expect(teamAStanding.pontos).toBe(3);
      expect(teamAStanding.vitorias).toBe(1);
      expect(teamAStanding.posicao).toBe(1);

      // Team B should have 0 points
      const teamBStanding = standings.find((s: any) => s.timeId === teamB.id);
      expect(teamBStanding.pontos).toBe(0);
      expect(teamBStanding.derrotas).toBe(1);
    });

    it('should handle multiple matches and update standings correctly', async () => {
      // Match 1: A beats B 2-0
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await request(app)
        .patch(`/api/matches/${match1.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
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
        });

      // Match 2: C beats B 1-0
      const match2 = await createTestMatch(championship.id, teamC.id, teamB.id, { rodada: 1 });
      await request(app)
        .patch(`/api/matches/${match2.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
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
        });

      // Match 3: A draws with C 1-1
      const match3 = await createTestMatch(championship.id, teamA.id, teamC.id, { rodada: 2 });
      await request(app)
        .patch(`/api/matches/${match3.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          golsTimeCasa: 1,
          golsTimeVisitante: 1,
          escalacoes: [
            { jogadorId: playerA.id, timeId: teamA.id, titular: true },
            { jogadorId: playerC.id, timeId: teamC.id, titular: true }
          ],
          estatisticas: [
            { jogadorId: playerA.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerC.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
          ]
        });

      // Verify final standings
      const standingsResponse = await request(app)
        .get(`/api/championships/${championship.id}/standings`);

      const standings = standingsResponse.body.data.classificacao;

      // A: 1 win + 1 draw = 4 points, goal diff: +2
      // C: 1 win + 1 draw = 4 points, goal diff: +1
      // B: 0 wins, 2 losses = 0 points

      expect(standings[0].timeId).toBe(teamA.id); // A first (better goal diff)
      expect(standings[0].pontos).toBe(4);
      expect(standings[1].timeId).toBe(teamC.id);
      expect(standings[1].pontos).toBe(4);
      expect(standings[2].timeId).toBe(teamB.id);
      expect(standings[2].pontos).toBe(0);
    });
  });
});
