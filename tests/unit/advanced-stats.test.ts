import * as statisticsService from '../../src/modules/statistics/statistics.service';
import prisma from '../../src/prisma/client';

// Mock prisma
jest.mock('../../src/prisma/client', () => ({
  __esModule: true,
  default: {
    jogador: {
      findUnique: jest.fn(),
    },
    time: {
      findUnique: jest.fn(),
    },
    estatistica: {
      findMany: jest.fn(),
    },
    partida: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Advanced Statistics Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerFullStats', () => {
    it('should throw error if player not found', async () => {
      (prisma.jogador.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(statisticsService.getPlayerFullStats(1))
        .rejects.toThrow('Jogador não encontrado');
    });

    it('should return complete player statistics', async () => {
      const mockPlayer = {
        id: 1,
        nome: 'Gabriel Barbosa',
        time: { id: 1, nome: 'Flamengo' }
      };

      const mockStats = [
        {
          gols: 2,
          assistencias: 1,
          cartoesAmarelos: 1,
          cartoesVermelhos: 0,
          partida: {
            campeonatoId: 1,
            campeonato: { id: 1, nome: 'Campeonato 2024' }
          }
        },
        {
          gols: 1,
          assistencias: 0,
          cartoesAmarelos: 0,
          cartoesVermelhos: 0,
          partida: {
            campeonatoId: 1,
            campeonato: { id: 1, nome: 'Campeonato 2024' }
          }
        },
      ];

      (prisma.jogador.findUnique as jest.Mock).mockResolvedValue(mockPlayer);
      (prisma.estatistica.findMany as jest.Mock).mockResolvedValue(mockStats);

      const result = await statisticsService.getPlayerFullStats(1);

      expect(result.jogador.nome).toBe('Gabriel Barbosa');
      expect(result.estatisticasGerais.totalGols).toBe(3);
      expect(result.estatisticasGerais.totalAssistencias).toBe(1);
      expect(result.estatisticasGerais.totalJogos).toBe(2);
      expect(result.porCampeonato).toHaveLength(1);
    });
  });

  describe('getTeamHistory', () => {
    it('should throw error if team not found', async () => {
      (prisma.time.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(statisticsService.getTeamHistory(1))
        .rejects.toThrow('Time não encontrado');
    });

    it('should return team history with pagination', async () => {
      const mockTeam = { id: 1, nome: 'Flamengo' };
      const mockMatches = [
        {
          id: 1,
          timeCasaId: 1,
          timeVisitanteId: 2,
          golsTimeCasa: 3,
          golsTimeVisitante: 1,
          dataHora: new Date('2024-01-15'),
          campeonato: { nome: 'Campeonato 2024' },
          timeCasa: { id: 1, nome: 'Flamengo' },
          timeVisitante: { id: 2, nome: 'Palmeiras' }
        }
      ];

      (prisma.time.findUnique as jest.Mock).mockResolvedValue(mockTeam);
      (prisma.partida.findMany as jest.Mock).mockResolvedValue(mockMatches);
      (prisma.partida.count as jest.Mock).mockResolvedValue(1);

      const result = await statisticsService.getTeamHistory(1, 10, 0);

      expect(result.time.nome).toBe('Flamengo');
      expect(result.historico).toHaveLength(1);
      expect(result.historico[0].resultado).toBe('vitoria');
      expect(result.estatisticas.vitorias).toBe(1);
    });
  });

  describe('getHeadToHead', () => {
    it('should throw error if team 1 not found', async () => {
      (prisma.time.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(statisticsService.getHeadToHead(1, 2))
        .rejects.toThrow('Time 1 não encontrado');
    });

    it('should throw error if team 2 not found', async () => {
      (prisma.time.findUnique as jest.Mock)
        .mockResolvedValueOnce({ id: 1, nome: 'Flamengo' })
        .mockResolvedValueOnce(null);

      await expect(statisticsService.getHeadToHead(1, 2))
        .rejects.toThrow('Time 2 não encontrado');
    });

    it('should return head-to-head statistics', async () => {
      const mockTeam1 = { id: 1, nome: 'Flamengo' };
      const mockTeam2 = { id: 2, nome: 'Palmeiras' };
      const mockMatches = [
        {
          id: 1,
          timeCasaId: 1,
          timeVisitanteId: 2,
          golsTimeCasa: 3,
          golsTimeVisitante: 1,
          dataHora: new Date('2024-01-15'),
          campeonato: { nome: 'Campeonato 2024' }
        },
        {
          id: 2,
          timeCasaId: 2,
          timeVisitanteId: 1,
          golsTimeCasa: 2,
          golsTimeVisitante: 2,
          dataHora: new Date('2024-02-15'),
          campeonato: { nome: 'Campeonato 2024' }
        }
      ];

      (prisma.time.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockTeam1)
        .mockResolvedValueOnce(mockTeam2);
      (prisma.partida.findMany as jest.Mock).mockResolvedValue(mockMatches);

      const result = await statisticsService.getHeadToHead(1, 2);

      expect(result.time1.nome).toBe('Flamengo');
      expect(result.time2.nome).toBe('Palmeiras');
      expect(result.confrontos.total).toBe(2);
      expect(result.confrontos.vitoriasTime1).toBe(1);
      expect(result.confrontos.empates).toBe(1);
      expect(result.confrontos.vitoriasTime2).toBe(0);
    });
  });
});
