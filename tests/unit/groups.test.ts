import { groupsService } from '../../src/modules/groups/groups.service';
import prisma from '../../src/prisma/client';

// Mock prisma
jest.mock('../../src/prisma/client', () => ({
  __esModule: true,
  default: {
    campeonato: {
      findUnique: jest.fn(),
    },
    inscricao: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    grupo: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    partida: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    classificacao: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Groups Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGroupNames', () => {
    it('should return correct group names for 2 groups', () => {
      const names = groupsService.getGroupNames(2);
      expect(names).toEqual(['Grupo A', 'Grupo B']);
    });

    it('should return correct group names for 4 groups', () => {
      const names = groupsService.getGroupNames(4);
      expect(names).toEqual(['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D']);
    });

    it('should return correct group names for 8 groups', () => {
      const names = groupsService.getGroupNames(8);
      expect(names).toEqual(['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H']);
    });
  });

  describe('validateGroupCreation', () => {
    it('should throw error if championship not found', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Campeonato não encontrado');
    });

    it('should throw error if user is not the organizer', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 2,
        tipo: 'misto',
      });

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Apenas o organizador pode criar os grupos');
    });

    it('should throw error if championship type is not misto', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'pontos_corridos',
      });

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Campeonato deve ser do tipo misto');
    });

    it('should throw error if groups already exist', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'misto',
      });
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Grupos já foram criados para este campeonato');
    });

    it('should throw error if number of teams is not divisible by groups', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'misto',
      });
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      ]);

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Número de times (5) deve ser divisível pelo número de grupos (2)');
    });

    it('should throw error if less than 4 teams', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'misto',
      });
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue([
        { id: 1 }, { id: 2 },
      ]);

      await expect(groupsService.validateGroupCreation(1, 1, 2))
        .rejects.toThrow('Mínimo de 4 times aprovados necessário');
    });

    it('should return championship and teams when validation passes', async () => {
      const mockChampionship = { id: 1, organizadorId: 1, tipo: 'misto' };
      const mockTeams = [
        { id: 1, timeId: 1, time: { nome: 'Time A' } },
        { id: 2, timeId: 2, time: { nome: 'Time B' } },
        { id: 3, timeId: 3, time: { nome: 'Time C' } },
        { id: 4, timeId: 4, time: { nome: 'Time D' } },
      ];

      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(mockChampionship);
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue(mockTeams);

      const result = await groupsService.validateGroupCreation(1, 1, 2);
      expect(result.championship).toEqual(mockChampionship);
      expect(result.approvedTeams).toEqual(mockTeams);
    });
  });

  describe('getGroups', () => {
    it('should throw error if championship not found', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(groupsService.getGroups(1))
        .rejects.toThrow('Campeonato não encontrado');
    });

    it('should throw error if championship is not misto', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        tipo: 'pontos_corridos',
      });

      await expect(groupsService.getGroups(1))
        .rejects.toThrow('Campeonato não é do tipo misto');
    });

    it('should return groups with teams', async () => {
      const mockChampionship = {
        id: 1,
        nome: 'Copa Mista',
        tipo: 'misto',
      };
      const mockGroups = [
        {
          id: 1,
          nome: 'Grupo A',
          inscricoes: [
            { time: { id: 1, nome: 'Time A' } },
            { time: { id: 2, nome: 'Time B' } },
          ],
          partidas: [],
        },
        {
          id: 2,
          nome: 'Grupo B',
          inscricoes: [
            { time: { id: 3, nome: 'Time C' } },
            { time: { id: 4, nome: 'Time D' } },
          ],
          partidas: [],
        },
      ];

      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(mockChampionship);
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue(mockGroups);

      const result = await groupsService.getGroups(1);
      expect(result.campeonato).toEqual(mockChampionship);
      expect(result.grupos).toHaveLength(2);
    });
  });

  describe('getGroupStandings', () => {
    it('should throw error if group not found', async () => {
      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([]);

      await expect(groupsService.getGroupStandings(1, 1))
        .rejects.toThrow('Grupo não encontrado');
    });

    it('should return group standings', async () => {
      const mockGroup = {
        id: 1,
        nome: 'Grupo A',
        campeonatoId: 1,
        inscricoes: [
          { timeId: 1, time: { id: 1, nome: 'Time A' } },
          { timeId: 2, time: { id: 2, nome: 'Time B' } },
        ],
      };

      const mockClassificacoes = [
        { timeId: 1, pontos: 6, jogos: 2, vitorias: 2, empates: 0, derrotas: 0, golsPro: 5, golsContra: 1, saldoGols: 4 },
        { timeId: 2, pontos: 3, jogos: 2, vitorias: 1, empates: 0, derrotas: 1, golsPro: 3, golsContra: 3, saldoGols: 0 },
      ];

      (prisma.grupo.findMany as jest.Mock).mockResolvedValue([mockGroup]);
      (prisma.classificacao.findMany as jest.Mock).mockResolvedValue(mockClassificacoes);

      const result = await groupsService.getGroupStandings(1, 1);
      expect(result.grupo.nome).toBe('Grupo A');
      expect(result.classificacao).toHaveLength(2);
    });
  });
});
