import prisma from '../../config/database';
import { AppError } from '../../middlewares/errorHandler';

export const getProfile = async (userId: number) => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404, 'USER_NOT_FOUND');
  }

  return user;
};

export const updateProfile = async (userId: number, data: { nome?: string }) => {
  const user = await prisma.usuario.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      criadoEm: true,
      atualizadoEm: true,
    },
  });

  return user;
};

export default { getProfile, updateProfile };
