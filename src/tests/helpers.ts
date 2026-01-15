import { faker } from '@faker-js/faker';
import prisma from '../config/database';
import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt';
import { TipoUsuario, TipoCampeonato, StatusInscricao } from '@prisma/client';

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
      tipo: overrides.tipo || 'administrador',
    },
  });

  const token = generateToken({
    userId: user.id,
    email: user.email,
    tipo: user.tipo,
  });

  return { user, token, plainPassword: senha };
};

export const createTestTeam = async (criadorId: number, overrides: Partial<{
  nome: string;
  escudo: string;
}> = {}) => {
  return prisma.time.create({
    data: {
      nome: overrides.nome || faker.company.name() + ' FC',
      escudo: overrides.escudo,
      cidade: faker.location.city(),
      responsavelId: criadorId,
    },
  });
};

export const createTestPlayer = async (timeId: number, overrides: Partial<{
  nome: string;
  dataNascimento: Date;
  posicao: string;
  numeroCamisa: number;
  foto: string;
}> = {}) => {
  return prisma.jogador.create({
    data: {
      nome: overrides.nome || faker.person.fullName(),
      dataNascimento: overrides.dataNascimento || faker.date.birthdate({ min: 18, max: 40, mode: 'age' }),
      posicao: overrides.posicao || faker.helpers.arrayElement(['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante']),
      numeroCamisa: overrides.numeroCamisa || faker.number.int({ min: 1, max: 99 }),
      foto: overrides.foto,
      timeId: timeId,
      documento: faker.string.numeric(11),
    },
  });
};

export const createTestChampionship = async (organizadorId: number, overrides: Partial<{
  nome: string;
  descricao: string;
  tipo: TipoCampeonato;
  dataInicio: Date;
  dataFim: Date;
}> = {}) => {
  return prisma.campeonato.create({
    data: {
      nome: overrides.nome || `Campeonato ${faker.location.city()} ${faker.date.future().getFullYear()}`,
      descricao: overrides.descricao || faker.lorem.paragraph(),
      tipo: overrides.tipo || 'pontos_corridos',
      dataInicio: overrides.dataInicio || faker.date.future(),
      dataFim: overrides.dataFim,
      inscricoesAbertas: true,
      organizadorId: organizadorId,
    },
  });
};

export const createTestInscription = async (campeonatoId: number, timeId: number, overrides: Partial<{
  status: StatusInscricao;
}> = {}) => {
  return prisma.inscricao.create({
    data: {
      campeonatoId: campeonatoId,
      timeId: timeId,
      status: overrides.status || 'pendente',
    },
  });
};

export const createTeamWithPlayers = async (criadorId: number, numPlayers = 7) => {
  const team = await createTestTeam(criadorId);
  
  const players = [];
  for (let i = 0; i < numPlayers; i++) {
    players.push(await createTestPlayer(team.id, { numeroCamisa: i + 1 }));
  }

  return { team, players };
};
