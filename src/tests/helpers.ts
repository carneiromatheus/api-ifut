import { faker } from '@faker-js/faker';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt';
import { TipoUsuario, Posicao, TipoCampeonato, StatusCampeonato, StatusInscricao } from '@prisma/client';

export const createTestUser = async (overrides: Partial<{
  nome: string;
  email: string;
  senha: string;
  tipo: TipoUsuario;
}> = {}) => {
  const senha = overrides.senha || 'senha12345';
  const hashedSenha = await bcrypt.hash(senha, 10);

  const user = await prisma.usuario.create({
    data: {
      nome: overrides.nome || faker.person.fullName(),
      email: overrides.email || faker.internet.email(),
      senha: hashedSenha,
      tipo: overrides.tipo || 'comum',
    },
  });

  // If organizador, create organizador record
  let organizador = null;
  if (user.tipo === 'organizador') {
    organizador = await prisma.organizador.create({
      data: { usuario_id: user.id },
    });
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    tipo: user.tipo,
  });

  return { user, token, plainPassword: senha, organizador };
};

export const createTestTeam = async (criadorId: number, overrides: Partial<{
  nome: string;
  escudo_url: string;
  ano_fundacao: number;
  cores: string[];
}> = {}) => {
  return prisma.time.create({
    data: {
      nome: overrides.nome || faker.company.name() + ' FC',
      escudo_url: overrides.escudo_url,
      ano_fundacao: overrides.ano_fundacao || faker.number.int({ min: 1900, max: 2020 }),
      cores: overrides.cores || [faker.color.human(), faker.color.human()],
      criador_id: criadorId,
    },
  });
};

export const createTestPlayer = async (timeId: number, overrides: Partial<{
  nome: string;
  data_nascimento: Date;
  posicao: Posicao;
  numero_camisa: number;
  foto_url: string;
}> = {}) => {
  return prisma.jogador.create({
    data: {
      nome: overrides.nome || faker.person.fullName(),
      data_nascimento: overrides.data_nascimento || faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
      posicao: overrides.posicao || faker.helpers.arrayElement(['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'] as Posicao[]),
      numero_camisa: overrides.numero_camisa || faker.number.int({ min: 1, max: 99 }),
      foto_url: overrides.foto_url,
      time_id: timeId,
    },
  });
};

export const createTestChampionship = async (organizadorId: number, overrides: Partial<{
  nome: string;
  descricao: string;
  tipo: TipoCampeonato;
  data_inicio: Date;
  data_fim: Date;
  status: StatusCampeonato;
}> = {}) => {
  return prisma.campeonato.create({
    data: {
      nome: overrides.nome || `Campeonato ${faker.location.city()} ${faker.date.future().getFullYear()}`,
      descricao: overrides.descricao || faker.lorem.paragraph(),
      tipo: overrides.tipo || 'pontos_corridos',
      data_inicio: overrides.data_inicio || faker.date.future(),
      data_fim: overrides.data_fim,
      status: overrides.status || 'aberto',
      organizador_id: organizadorId,
    },
  });
};

export const createTestInscription = async (campeonatoId: number, timeId: number, overrides: Partial<{
  status: StatusInscricao;
}> = {}) => {
  return prisma.inscricao.create({
    data: {
      campeonato_id: campeonatoId,
      time_id: timeId,
      status: overrides.status || 'pendente',
    },
  });
};

export const createTeamWithPlayers = async (criadorId: number, numPlayers = 7) => {
  const team = await createTestTeam(criadorId);
  
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push(await createTestPlayer(team.id, { numero_camisa: i + 1 }));
  }

  return { team, players };
};
