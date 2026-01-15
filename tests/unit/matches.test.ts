import { 
  createTestUser, 
  createTestTeam, 
  createTestChampionship, 
  createApprovedRegistration,
  prisma 
} from '../helpers/testUtils';
import * as matchesService from '../../src/modules/matches/matches.service';

describe('Matches Module', () => {
  let organizer: any;
  let otherUser: any;
  let championship: any;
  let teamA: any;
  let teamB: any;
  let teamC: any;

  beforeEach(async () => {
    // Clean database
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
    teamC = await createTestTeam(organizer.id, { nome: 'Time C' });

    // Approve registrations for teams A and B
    await createApprovedRegistration(championship.id, teamA.id);
    await createApprovedRegistration(championship.id, teamB.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Create Match', () => {
    it('should create a match successfully', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00'),
        local: 'Estádio Municipal'
      };

      const match = await matchesService.createMatch(matchData, organizer.id);

      expect(match).toBeDefined();
      expect(match.campeonatoId).toBe(championship.id);
      expect(match.timeCasaId).toBe(teamA.id);
      expect(match.timeVisitanteId).toBe(teamB.id);
      expect(match.rodada).toBe(1);
      expect(match.status).toBe('agendada');
    });

    it('should fail if user is not the championship organizer (RN11)', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await expect(matchesService.createMatch(matchData, otherUser.id))
        .rejects.toThrow('Apenas o organizador do campeonato pode criar partidas');
    });

    it('should fail if home team is not approved (RN12)', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamC.id, // Not approved
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await expect(matchesService.createMatch(matchData, organizer.id))
        .rejects.toThrow('Time da casa não está inscrito e aprovado no campeonato');
    });

    it('should fail if away team is not approved (RN12)', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamC.id, // Not approved
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await expect(matchesService.createMatch(matchData, organizer.id))
        .rejects.toThrow('Time visitante não está inscrito e aprovado no campeonato');
    });

    it('should fail if match already exists in the same round', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await matchesService.createMatch(matchData, organizer.id);

      // Try to create same match again
      await expect(matchesService.createMatch(matchData, organizer.id))
        .rejects.toThrow('Confronto já existe nesta rodada');
    });

    it('should fail if teams are the same', async () => {
      const matchData = {
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamA.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await expect(matchesService.createMatch(matchData, organizer.id))
        .rejects.toThrow('Times da casa e visitante devem ser diferentes');
    });

    it('should fail if championship does not exist', async () => {
      const matchData = {
        campeonatoId: 99999,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      };

      await expect(matchesService.createMatch(matchData, organizer.id))
        .rejects.toThrow('Campeonato não encontrado');
    });
  });

  describe('List Matches', () => {
    beforeEach(async () => {
      // Create some matches
      await matchesService.createMatch({
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      }, organizer.id);

      await matchesService.createMatch({
        campeonatoId: championship.id,
        timeCasaId: teamB.id,
        timeVisitanteId: teamA.id,
        rodada: 2,
        dataHora: new Date('2025-02-08T15:00:00')
      }, organizer.id);
    });

    it('should list all matches of a championship', async () => {
      const matches = await matchesService.listByChampionship(championship.id);
      
      expect(matches).toHaveLength(2);
    });

    it('should filter matches by round', async () => {
      const matches = await matchesService.listByChampionship(championship.id, { rodada: 1 });
      
      expect(matches).toHaveLength(1);
      expect(matches[0].rodada).toBe(1);
    });

    it('should filter matches by status', async () => {
      const matches = await matchesService.listByChampionship(championship.id, { status: 'agendada' });
      
      expect(matches).toHaveLength(2);
      expect(matches.every((m: any) => m.status === 'agendada')).toBe(true);
    });

    it('should return empty array for non-existent championship', async () => {
      const matches = await matchesService.listByChampionship(99999);
      
      expect(matches).toHaveLength(0);
    });
  });

  describe('Get Match by ID', () => {
    it('should get match details', async () => {
      const createdMatch = await matchesService.createMatch({
        campeonatoId: championship.id,
        timeCasaId: teamA.id,
        timeVisitanteId: teamB.id,
        rodada: 1,
        dataHora: new Date('2025-02-01T15:00:00')
      }, organizer.id);

      const match = await matchesService.getById(createdMatch.id);

      expect(match).toBeDefined();
      expect(match.id).toBe(createdMatch.id);
      expect(match.timeCasa).toBeDefined();
      expect(match.timeVisitante).toBeDefined();
      expect(match.campeonato).toBeDefined();
    });

    it('should throw error for non-existent match', async () => {
      await expect(matchesService.getById(99999))
        .rejects.toThrow('Partida não encontrada');
    });
  });
});
