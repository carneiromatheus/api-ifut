import bcrypt from 'bcryptjs';
import prisma from '../../prisma/client';
import { generateToken } from '../../utils/jwt';
import { TipoUsuario } from '@prisma/client';

interface RegisterData {
  nome: string;
  email: string;
  senha: string;
  tipo?: TipoUsuario;
}

interface LoginData {
  email: string;
  senha: string;
}

export const register = async (data: RegisterData) => {
  const { nome, email, senha, tipo = 'organizador' } = data;

  if (!nome || !email || !senha) {
    throw new Error('Campos obrigatórios: nome, email, senha');
  }

  const existingUser = await prisma.usuario.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email já cadastrado');
  }

  const hashedPassword = await bcrypt.hash(senha, 10);

  const user = await prisma.usuario.create({
    data: {
      nome,
      email,
      senha: hashedPassword,
      tipo: tipo as TipoUsuario
    },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      criadoEm: true
    }
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    tipo: user.tipo
  });

  return { user, token };
};

export const login = async (data: LoginData) => {
  const { email, senha } = data;

  if (!email || !senha) {
    throw new Error('Email e senha são obrigatórios');
  }

  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  if (!user.ativo) {
    throw new Error('Usuário inativo');
  }

  const validPassword = await bcrypt.compare(senha, user.senha);
  if (!validPassword) {
    throw new Error('Credenciais inválidas');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    tipo: user.tipo
  });

  return {
    user: {
      id: user.id,
      nome: user.nome,
      email: user.email,
      tipo: user.tipo
    },
    token
  };
};

export const getProfile = async (userId: number) => {
  const user = await prisma.usuario.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nome: true,
      email: true,
      tipo: true,
      ativo: true,
      criadoEm: true
    }
  });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return user;
};
