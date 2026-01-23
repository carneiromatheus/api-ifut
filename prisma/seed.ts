import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const AUTO_ENROLL_TEAMS = false;

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Clean existing data
  console.log('🧹 Limpando dados existentes...');
  await prisma.estatistica.deleteMany();
  await prisma.escalacao.deleteMany();
  await prisma.classificacao.deleteMany();
  await prisma.partida.deleteMany();
  await prisma.fase.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.inscricao.deleteMany();
  await prisma.jogador.deleteMany();
  await prisma.time.deleteMany();
  await prisma.campeonato.deleteMany();
  await prisma.usuario.deleteMany();

  // Create users
  console.log('👤 Criando usuários...');
  const hashedPassword = await bcrypt.hash('senha123', 10);

  // Create 1 organizer
  const organizer = await prisma.usuario.create({
    data: {
      nome: 'Organizador IFMG',
      email: 'organizador@ifut.com',
      senha: hashedPassword,
      tipo: 'organizador'
    }
  });

  console.log(`✅ Organizador criado: ${organizer.email}`);

  // Create 10 coaches (técnicos)
  const coaches = [];
  const teams = [];
  const teamNames = [
    'Corinthians FC', 'Palmeiras FC', 'São Paulo FC', 'Santos FC',
    'Flamengo FC', 'Vasco FC', 'Botafogo FC', 'Fluminense FC',
    'Atlético MG', 'Cruzeiro FC'
  ];

  const cities = [
    'Sabará', 'Belo Horizonte', 'Contagem', 'Betim',
    'Nova Lima', 'Ribeirão das Neves', 'Santa Luzia', 'Ibirité',
    'Sete Lagoas', 'Vespasiano'
  ];

  const positions = ['goleiro', 'zagueiro', 'lateral', 'volante', 'meia', 'atacante'];

  const firstNames = [
    'João', 'Pedro', 'Lucas', 'Gabriel', 'Rafael', 'Felipe', 'Bruno', 'Thiago',
    'Carlos', 'André', 'Diego', 'Fernando', 'Marcos', 'Paulo', 'Roberto', 'Vinícius',
    'Matheus', 'Rodrigo', 'Leonardo', 'Gustavo', 'Eduardo', 'Daniel', 'Renato', 'Fábio'
  ];

  const lastNames = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira',
    'Rodrigues', 'Almeida', 'Nascimento', 'Carvalho', 'Araújo', 'Ribeiro', 'Martins', 'Rocha'
  ];

  for (let i = 0; i < 10; i++) {
    const coach = await prisma.usuario.create({
      data: {
        nome: `Técnico ${teamNames[i]}`,
        email: `tecnico${i + 1}@ifut.com`,
        senha: hashedPassword,
        tipo: 'tecnico'
      }
    });

    coaches.push(coach);

    // Create 1 team for each coach
    const team = await prisma.time.create({
      data: {
        nome: teamNames[i],
        cidade: cities[i],
        fundadoEm: new Date(2000 + i, 0, 1),
        responsavelId: coach.id
      }
    });

    console.log(`✅ Time criado: ${team.nome} (Técnico: ${coach.nome})`);

    teams.push(team);

    // Create 11 players for each team
    const players = [];
    for (let j = 0; j < 11; j++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const playerName = `${firstName} ${lastName}`;
      
      let position;
      if (j === 0) {
        position = 'goleiro';
      } else if (j <= 4) {
        position = Math.random() > 0.5 ? 'zagueiro' : 'lateral';
      } else if (j <= 7) {
        position = Math.random() > 0.5 ? 'volante' : 'meia';
      } else {
        position = 'atacante';
      }

      const player = await prisma.jogador.create({
        data: {
          nome: playerName,
          apelido: firstName,
          dataNascimento: new Date(1990 + Math.floor(Math.random() * 15), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          posicao: position,
          numeroCamisa: j + 1,
          documento: `${String(i).padStart(2, '0')}${String(j).padStart(2, '0')}${Math.floor(Math.random() * 10000000000).toString().padStart(10, '0')}`,
          timeId: team.id
        }
      });

      players.push(player);
    }

    console.log(`  ⚽ ${players.length} jogadores criados para ${team.nome}`);
  }

  // Create championship
  console.log('\n🏆 Criando campeonato...');
  const championship = await prisma.campeonato.create({
    data: {
      nome: 'Campeonato Regional 2026',
      descricao: 'Primeira edição do campeonato regional de pontos corridos',
      tipo: 'pontos_corridos',
      dataInicio: new Date('2026-02-01'),
      dataFim: new Date('2026-06-30'),
      limiteTimesMinimo: 8,
      limiteTimesMaximo: 16,
      iniciado: false,
      organizadorId: organizer.id
    }
  });

  // Create approved registrations for all teams
  console.log('📝 Inscrevendo todos os times no campeonato...');
  for (const team of teams) {
    await prisma.inscricao.create({
      data: {
        campeonatoId: championship.id,
        timeId: team.id,
        status: 'aprovada'
      }
    });

    // Create classification entry for each team
    await prisma.classificacao.create({
      data: {
        campeonatoId: championship.id,
        timeId: team.id,
        pontos: 0,
        jogos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        golsPro: 0,
        golsContra: 0,
        saldoGols: 0
      }
    });
  }

  console.log('\n✨ Seed concluído com sucesso!');
  console.log(`📊 Resumo:`);
  console.log(`   - 1 Organizador`);
  console.log(`   - 10 Técnicos`);
  console.log(`   - 10 Times`);
  console.log(`   - 110 Jogadores (11 por time)`);
  console.log(`   - 1 Campeonato de Pontos Corridos com 10 times inscritos`);
  console.log(`\n🔑 Login padrão para todos os usuários:`);
  console.log(`   Email: organizador@ifut.com ou tecnico1@ifut.com (até tecnico10@ifut.com)`);
  console.log(`   Senha: senha123`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
