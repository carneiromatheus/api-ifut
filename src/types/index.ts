import { TipoUsuario, Posicao, TipoCampeonato, StatusCampeonato, StatusInscricao, StatusPartida } from '@prisma/client';

export { TipoUsuario, Posicao, TipoCampeonato, StatusCampeonato, StatusInscricao, StatusPartida };

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
