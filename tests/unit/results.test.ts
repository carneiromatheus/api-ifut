import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  createTestPlayer,
  createTestMatch,
  prisma 
} from '../helpers/testUtils';
import * as resultsService from '../../src/modules/results/results.service';

describe('Results Module', () => {
  let organizer: any;
  let otherUser: any;
  let championship: any;
  let teamA: any;
  let teamB: any;
  let match: any;
  let playerA1: any;
  let playerA2: any;
  let playerB1: any;
  let playerB2: any;

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

    const otherResult = await createTestUser({ tipo: 'organizador', email: 'other@test.com' });
    otherUser = { ...otherResult.user, token: otherResult.token };

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
    playerB2 = await createTestPlayer(teamB.id, { nome: 'Jogador B2', numeroCamisa: 8, documento: '44444444444' });

    // Create match
    match = await createTestMatch(championship.id, teamA.id, teamB.id, {
      rodada: 1,
      dataHora: new Date('2025-02-01T15:00:00'),
      status: 'agendada'
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Register Result', () => {
    it('should register match result successfully', async () => {
      const resultData = {
        golsTimeCasa: 2,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerA2.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true },
          { jogadorId: playerB2.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerA2.id, gols: 0, assistencias: 2, cartoesAmarelos: 1, cartoesVermelhos: 0 },
          { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB2.id, gols: 0, assistencias: 1, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      };

      const result = await resultsService.registerResult(match.id, resultData, organizer.id);

      expect(result).toBeDefined();
      expect(result.golsTimeCasa).toBe(2);
      expect(result.golsTimeVisitante).toBe(1);
      expect(result.status).toBe('finalizada');
    });

    it('should fail if user is not the organizer (RN13)', async () => {
      const resultData = {
        golsTimeCasa: 2,
        golsTimeVisitante: 1,
        escalacoes: [],
        estatisticas: []
      };

      await expect(resultsService.registerResult(match.id, resultData, otherUser.id))
        .rejects.toThrow('Apenas o organizador do campeonato pode registrar resultados');
    });

    it('should fail if goals sum does not match score (RN15)', async () => {
      const resultData = {
        golsTimeCasa: 3,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 } // Only 2 goals registered but 3 declared
        ]
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Soma de gols individuais do time da casa');
    });

    it('should fail if player appears twice in lineup (RN16)', async () => {
      const resultData = {
        golsTimeCasa: 1,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerA1.id, timeId: teamA.id, titular: false } // Duplicate
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Jogador não pode estar duas vezes na escalação');
    });

    it('should fail if player does not belong to the team', async () => {
      const resultData = {
        golsTimeCasa: 1,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerB1.id, timeId: teamA.id, titular: true } // Player B1 belongs to team B, not A
        ],
        estatisticas: [
          { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Jogador não pertence ao time indicado');
    });

    it('should fail if match is already finished', async () => {
      // Update match to finished
      await prisma.partida.update({
        where: { id: match.id },
        data: { status: 'finalizada' }
      });

      const resultData = {
        golsTimeCasa: 1,
        golsTimeVisitante: 0,
        escalacoes: [],
        estatisticas: []
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Partida não está em status válido para registro de resultado');
    });

    it('should fail if yellow cards exceed 2', async () => {
      const resultData = {
        golsTimeCasa: 0,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 0, assistencias: 0, cartoesAmarelos: 3, cartoesVermelhos: 0 }
        ]
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Cartões amarelos devem ser entre 0 e 2');
    });

    it('should fail if red cards exceed 1', async () => {
      const resultData = {
        golsTimeCasa: 0,
        golsTimeVisitante: 0,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 0, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 2 }
        ]
      };

      await expect(resultsService.registerResult(match.id, resultData, organizer.id))
        .rejects.toThrow('Cartões vermelhos devem ser entre 0 e 1');
    });

    it('should update classification after result (RN14)', async () => {
      const resultData = {
        golsTimeCasa: 2,
        golsTimeVisitante: 1,
        escalacoes: [
          { jogadorId: playerA1.id, timeId: teamA.id, titular: true },
          { jogadorId: playerB1.id, timeId: teamB.id, titular: true }
        ],
        estatisticas: [
          { jogadorId: playerA1.id, gols: 2, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 },
          { jogadorId: playerB1.id, gols: 1, assistencias: 0, cartoesAmarelos: 0, cartoesVermelhos: 0 }
        ]
      };

      await resultsService.registerResult(match.id, resultData, organizer.id);

      // Check classification was updated
      const classA = await prisma.classificacao.findFirst({
        where: { campeonatoId: championship.id, timeId: teamA.id }
      });
      const classB = await prisma.classificacao.findFirst({
        where: { campeonatoId: championship.id, timeId: teamB.id }
      });

      expect(classA?.pontos).toBe(3); // Winner gets 3 points
      expect(classA?.vitorias).toBe(1);
      expect(classA?.golsPro).toBe(2);
      expect(classA?.golsContra).toBe(1);

      expect(classB?.pontos).toBe(0); // Loser gets 0 points
      expect(classB?.derrotas).toBe(1);
    });
  });
});
