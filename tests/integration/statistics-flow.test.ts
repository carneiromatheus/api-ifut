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

describe('Statistics Flow Integration Tests', () => {
  let organizer: any;
  let organizerToken: string;
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
    organizer = orgResult.user;
    organizerToken = orgResult.token;

    championship = await createTestChampionship(organizer.id, {
      nome: 'Campeonato Teste',
      dataInicio: new Date('2025-01-01')
    });

    teamA = await createTestTeam(organizer.id, { nome: 'Time A' });
    teamB = await createTestTeam(organizer.id, { nome: 'Time B' });

    await createApprovedRegistration(championship.id, teamA.id);
    await createApprovedRegistration(championship.id, teamB.id);

    playerA1 = await createTestPlayer(teamA.id, { nome: 'Artilheiro A1', documento: '11111111111' });
    playerA2 = await createTestPlayer(teamA.id, { nome: 'Jogador A2', documento: '22222222222' });
    playerB1 = await createTestPlayer(teamB.id, { nome: 'Jogador B1', documento: '33333333333' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Complete Statistics Flow', () => {
    it('should register statistics -> get top scorers', async () => {
      // Match 1: A1 scores 3, A2 scores 1
      const match1 = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await request(app)
        .patch(`/api/matches/${match1.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          golsTimeCasa: 4,
          golsTimeVisitante: 1,
          escalacoes: [
            { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
            { jogadorId: playerA2.id, timeId: teamA.id, titular: true },
            { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
          ],
          estatisticas: [
            { jogadorId: playerA1.id, gols: 3, assistencias: 1, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerA2.id, gols: 1, assistencias: 2, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 1, cartoesVermelhos: 0 }
          ]
        });

      // Match 2: B1 scores 2, A1 scores 1
      const match2 = await createTestMatch(championship.id, teamB.id, teamA.id, { rodada: 2 });
      await request(app)
        .patch(`/api/matches/${match2.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          golsTimeCasa: 2,
          golsTimeVisitante: 1,
          escalacoes: [
            { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
            { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
          ],
          estatisticas: [
            { jogadorId: playerA1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerB1.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
          ]
        });

      // Get top scorers
      const topScorersResponse = await request(app)
        .get(`/api/championships/${championship.id}/top-scorers`);

      expect(topScorersResponse.status).toBe(200);
      const artilheiros = topScorersResponse.body.data.artilheiros;

      // A1 should be first with 4 goals (3 + 1)
      expect(artilheiros[0].jogadorId).toBe(playerA1.id);
      expect(artilheiros[0].gols).toBe(4);
      expect(artilheiros[0].assistencias).toBe(1);
      expect(artilheiros[0].jogos).toBe(2);

      // B1 should be second with 3 goals (1 + 2)
      expect(artilheiros[1].jogadorId).toBe(playerB1.id);
      expect(artilheiros[1].gols).toBe(3);

      // A2 should be third with 1 goal
      expect(artilheiros[2].jogadorId).toBe(playerA2.id);
      expect(artilheiros[2].gols).toBe(1);
    });

    it('should respect limit parameter', async () => {
      const match = await createTestMatch(championship.id, teamA.id, teamB.id, { rodada: 1 });
      await request(app)
        .patch(`/api/matches/${match.id}/result`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          golsTimeCasa: 2,
          golsTimeVisitante: 1,
          escalacoes: [
            { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
            { jogadorId: playerA2.id, timeId: teamA.id, titular: true },
            { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
          ],
          estatisticas: [
            { jogadorId: playerA1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerA2.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
            { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
          ]
        });

      const response = await request(app)
        .get(`/api/championships/${championship.id}/top-scorers?limit=2`);

      expect(response.body.data.artilheiros).toHaveLength(2);
    });
  });
});
