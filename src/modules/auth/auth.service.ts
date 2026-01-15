import bcrypt from 'bcryptjs';
import prisma from '../../prisma/client';
import { generateToken } from '../../utils/jwt';
import { TipoUsuario } from '@prisma/client';

interface RegisterData {
  nome?: string;
  name?: string;
  email: string;
  senha?: string;
  password?: string;
  tipo?: TipoUsuario;
  role?: string;
}

interface LoginData {
  email: string;
  senha?: string;
  password?: string;
}

// Mapeador de roles do front-end para valores do banco de dados
const mapRoleToTipoUsuario = (role?: string): TipoUsuario => {
  if (!role) return TipoUsuario.organizador;
  
  const roleMap: { [key: string]: TipoUsuario } = {
    'ORGANIZER': TipoUsuario.organizador,
    'COACH': TipoUsuario.tecnico,
    'ADMIN': TipoUsuario.administrador,
    'organizador': TipoUsuario.organizador,
    'tecnico': TipoUsuario.tecnico,
    'administrador': TipoUsuario.administrador,
  };
  
  return roleMap[role] || TipoUsuario.organizador;
};

// Mapeador de valores do banco de dados para roles do front-end
const mapTipoUsuarioToRole = (tipo: TipoUsuario): 'COACH' | 'ORGANIZER' | 'ADMIN' => {
  const roleMap: { [key in TipoUsuario]: 'COACH' | 'ORGANIZER' | 'ADMIN' } = {
    [TipoUsuario.organizador]: 'ORGANIZER',
    [TipoUsuario.tecnico]: 'COACH',
    [TipoUsuario.administrador]: 'ADMIN',
  };
  
  return roleMap[tipo] || 'ORGANIZER';
};

export const register = async (data: RegisterData) => {
  const nome = data.nome || data.name;
  const email = data.email;
  const senha = data.senha || data.password;
  const tipo = data.tipo || mapRoleToTipoUsuario(data.role);

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
      tipo
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

  return {
    user: {
      id: user.id,
      name: user.nome,
      email: user.email,
      role: mapTipoUsuarioToRole(user.tipo),
      createdAt: user.criadoEm.toISOString(),
      updatedAt: user.criadoEm.toISOString(),
    },
    token,
  };
};

export const login = async (data: LoginData) => {
  const email = data.email;
  const senha = data.senha || data.password;

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
      name: user.nome,
      email: user.email,
      role: mapTipoUsuarioToRole(user.tipo),
      createdAt: user.criadoEm.toISOString(),
      updatedAt: user.criadoEm.toISOString(),
    },
    token,
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

  return {
    id: user.id,
    name: user.nome,
    email: user.email,
    role: mapTipoUsuarioToRole(user.tipo),
    createdAt: user.criadoEm.toISOString(),
    updatedAt: user.criadoEm.toISOString(),
  };
};
