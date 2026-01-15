import { TipoUsuario, TipoCampeonato, StatusInscricao, StatusPartida } from '@prisma/client';

export { TipoUsuario, TipoCampeonato, StatusInscricao, StatusPartida };

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
