import { bracketService } from '../../src/modules/bracket/bracket.service';
import prisma from '../../src/prisma/client';
import { faker } from '@faker-js/faker';

// Mock prisma
jest.mock('../../src/prisma/client', () => ({
  __esModule: true,
  default: {
    campeonato: {
      findUnique: jest.fn(),
    },
    inscricao: {
      findMany: jest.fn(),
    },
    fase: {
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    partida: {
      createMany: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Bracket Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPowerOfTwo', () => {
    it('should return true for power of 2 numbers', () => {
      expect(bracketService.isPowerOfTwo(4)).toBe(true);
      expect(bracketService.isPowerOfTwo(8)).toBe(true);
      expect(bracketService.isPowerOfTwo(16)).toBe(true);
      expect(bracketService.isPowerOfTwo(32)).toBe(true);
    });

    it('should return false for non-power of 2 numbers', () => {
      expect(bracketService.isPowerOfTwo(3)).toBe(false);
      expect(bracketService.isPowerOfTwo(5)).toBe(false);
      expect(bracketService.isPowerOfTwo(6)).toBe(false);
      expect(bracketService.isPowerOfTwo(10)).toBe(false);
    });
  });

  describe('getPhaseNames', () => {
    it('should return correct phase names for 4 teams', () => {
      const phases = bracketService.getPhaseNames(4);
      expect(phases).toEqual(['Semi-final', 'Final']);
    });

    it('should return correct phase names for 8 teams', () => {
      const phases = bracketService.getPhaseNames(8);
      expect(phases).toEqual(['Quartas de final', 'Semi-final', 'Final']);
    });

    it('should return correct phase names for 16 teams', () => {
      const phases = bracketService.getPhaseNames(16);
      expect(phases).toEqual(['Oitavas de final', 'Quartas de final', 'Semi-final', 'Final']);
    });

    it('should return correct phase names for 32 teams', () => {
      const phases = bracketService.getPhaseNames(32);
      expect(phases).toEqual(['32-avos de final', 'Oitavas de final', 'Quartas de final', 'Semi-final', 'Final']);
    });
  });

  describe('validateBracketCreation', () => {
    it('should throw error if championship not found', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Campeonato não encontrado');
    });

    it('should throw error if user is not the organizer', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 2,
        tipo: 'mata_mata',
      });

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Apenas o organizador pode criar o chaveamento');
    });

    it('should throw error if championship type is not mata_mata', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'pontos_corridos',
      });

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Campeonato deve ser do tipo mata-mata');
    });

    it('should throw error if bracket already exists', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'mata_mata',
      });
      (prisma.fase.findMany as jest.Mock).mockResolvedValue([{ id: 1 }]);

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Chaveamento já foi criado para este campeonato');
    });

    it('should throw error if number of teams is not power of 2', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'mata_mata',
      });
      (prisma.fase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue([
        { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      ]);

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Número de times deve ser potência de 2');
    });

    it('should throw error if less than 4 approved teams', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        organizadorId: 1,
        tipo: 'mata_mata',
      });
      (prisma.fase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue([
        { id: 1 }, { id: 2 },
      ]);

      await expect(bracketService.validateBracketCreation(1, 1))
        .rejects.toThrow('Mínimo de 4 times aprovados necessário');
    });

    it('should return championship and teams when validation passes', async () => {
      const mockChampionship = { id: 1, organizadorId: 1, tipo: 'mata_mata' };
      const mockTeams = [
        { id: 1, timeId: 1, time: { nome: 'Time A' } },
        { id: 2, timeId: 2, time: { nome: 'Time B' } },
        { id: 3, timeId: 3, time: { nome: 'Time C' } },
        { id: 4, timeId: 4, time: { nome: 'Time D' } },
      ];

      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(mockChampionship);
      (prisma.fase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue(mockTeams);

      const result = await bracketService.validateBracketCreation(1, 1);
      expect(result.championship).toEqual(mockChampionship);
      expect(result.approvedTeams).toEqual(mockTeams);
    });
  });

  describe('createBracket', () => {
    it('should create bracket with phases and matches', async () => {
      const mockChampionship = { id: 1, organizadorId: 1, tipo: 'mata_mata' };
      const mockTeams = [
        { id: 1, timeId: 1, time: { id: 1, nome: 'Time A' } },
        { id: 2, timeId: 2, time: { id: 2, nome: 'Time B' } },
        { id: 3, timeId: 3, time: { id: 3, nome: 'Time C' } },
        { id: 4, timeId: 4, time: { id: 4, nome: 'Time D' } },
      ];

      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(mockChampionship);
      (prisma.fase.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.inscricao.findMany as jest.Mock).mockResolvedValue(mockTeams);
      (prisma.$transaction as jest.Mock).mockResolvedValue({
        fases: [
          { id: 1, nome: 'Semi-final', ordem: 1 },
          { id: 2, nome: 'Final', ordem: 2 },
        ],
        partidas: [
          { id: 1, faseId: 1 },
          { id: 2, faseId: 1 },
          { id: 3, faseId: 2 },
        ],
      });

      const result = await bracketService.createBracket(1, 1);
      expect(result.fases).toHaveLength(2);
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getBracket', () => {
    it('should throw error if championship not found', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(bracketService.getBracket(1))
        .rejects.toThrow('Campeonato não encontrado');
    });

    it('should throw error if championship is not mata_mata', async () => {
      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        tipo: 'pontos_corridos',
      });

      await expect(bracketService.getBracket(1))
        .rejects.toThrow('Campeonato não é do tipo mata-mata');
    });

    it('should return bracket data', async () => {
      const mockChampionship = {
        id: 1,
        nome: 'Copa Teste',
        tipo: 'mata_mata',
      };
      const mockFases = [
        {
          id: 1,
          nome: 'Semi-final',
          ordem: 1,
          partidas: [
            {
              id: 1,
              timeCasa: { id: 1, nome: 'Time A' },
              timeVisitante: { id: 2, nome: 'Time B' },
              golsTimeCasa: 2,
              golsTimeVisitante: 1,
              status: 'finalizada',
            },
          ],
        },
      ];

      (prisma.campeonato.findUnique as jest.Mock).mockResolvedValue(mockChampionship);
      (prisma.fase.findMany as jest.Mock).mockResolvedValue(mockFases);

      const result = await bracketService.getBracket(1);
      expect(result.campeonato).toEqual(mockChampionship);
      expect(result.fases).toHaveLength(1);
    });
  });
});
