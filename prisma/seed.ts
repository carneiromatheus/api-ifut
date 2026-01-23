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
    'Dragões Azuis', 'Leões Vermelhos', 'Falcões Negros', 'Gigantes do Vale',
    'Titãs Amarelos', 'Guerreiros Verde-Brancos', 'Feras Douradas', 'Campeões da Serra',
    'Estrelas Noturnas', 'Atletas Invictos'
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

    // Create 20-30 players for each team
    const playerCount = Math.floor(Math.random() * 11) + 20; // 20-30 players
    const players = [];
    for (let j = 0; j < playerCount; j++) {
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

  // Create championships
  console.log('\n🏆 Criando campeonatos...');
  
  // Championship 2025-2026 (ongoing, in last 30 matches)
  const championship20252026 = await prisma.campeonato.create({
    data: {
      nome: 'Campeonato 2025-2026',
      descricao: 'Campeonato em andamento - nas últimas 30 partidas',
      tipo: 'pontos_corridos',
      dataInicio: new Date('2025-02-01'),
      dataFim: new Date('2026-06-30'),
      limiteTimesMinimo: 8,
      limiteTimesMaximo: 16,
      iniciado: true,
      organizadorId: organizer.id
    }
  });

  // Championship 2026-2027 (not started)
  const championship20262027 = await prisma.campeonato.create({
    data: {
      nome: 'Campeonato 2026-2027',
      descricao: 'Próxima edição - ainda não iniciado',
      tipo: 'pontos_corridos',
      dataInicio: new Date('2026-08-01'),
      dataFim: new Date('2027-06-30'),
      limiteTimesMinimo: 8,
      limiteTimesMaximo: 16,
      iniciado: false,
      organizadorId: organizer.id
    }
  });

  // Create approved registrations for all teams in both championships
  console.log('📝 Inscrevendo todos os times nos campeonatos...');
  
  // Initialize classification data for all teams
  const classificationData: { [teamId: number]: any } = {};
  for (const team of teams) {
    classificationData[team.id] = {
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldoGols: 0
    };

    // Championship 2025-2026
    await prisma.inscricao.create({
      data: {
        campeonatoId: championship20252026.id,
        timeId: team.id,
        status: 'aprovada'
      }
    });

    // Championship 2026-2027
    await prisma.inscricao.create({
      data: {
        campeonatoId: championship20262027.id,
        timeId: team.id,
        status: 'aprovada'
      }
    });
  }

  // Create matches and statistics for Championship 2025-2026 (last 30 matches)
  console.log('\n⚽ Criando partidas e estatísticas para o campeonato 2025-2026...');
  
  // For a 10-team league, there are 45 total matches (each team plays 9 matches)
  // We'll create the last 30 matches
  const matchCount = 30;
  let matchesCreated = 0;
  const startDate = new Date('2026-03-01'); // Start from March 2026
  
  for (let round = 1; round <= 5; round++) {
    for (let matchIdx = 0; matchIdx < teams.length / 2; matchIdx++) {
      if (matchesCreated >= matchCount) break;
      
      const teamA = teams[matchIdx];
      const teamB = teams[teams.length - 1 - matchIdx];
      
      if (teamA.id === teamB.id) continue;
      
      // Create match
      const goalsA = Math.floor(Math.random() * 5);
      const goalsB = Math.floor(Math.random() * 5);
      
      const matchDate = new Date(startDate);
      matchDate.setDate(matchDate.getDate() + (round - 1) * 7 + matchIdx);
      
      const match = await prisma.partida.create({
        data: {
          campeonatoId: championship20252026.id,
          timeCasaId: teamA.id,
          timeVisitanteId: teamB.id,
          rodada: 16 + round, // Starting from round 16 (last 30 matches)
          dataHora: matchDate,
          local: `Estádio de ${teamA.cidade}`,
          status: 'finalizada',
          golsTimeCasa: goalsA,
          golsTimeVisitante: goalsB
        }
      });

      // Update classification for both teams
      classificationData[teamA.id].jogos++;
      classificationData[teamB.id].jogos++;
      classificationData[teamA.id].golsPro += goalsA;
      classificationData[teamA.id].golsContra += goalsB;
      classificationData[teamB.id].golsPro += goalsB;
      classificationData[teamB.id].golsContra += goalsA;

      if (goalsA > goalsB) {
        classificationData[teamA.id].vitorias++;
        classificationData[teamA.id].pontos += 3;
        classificationData[teamB.id].derrotas++;
      } else if (goalsB > goalsA) {
        classificationData[teamB.id].vitorias++;
        classificationData[teamB.id].pontos += 3;
        classificationData[teamA.id].derrotas++;
      } else {
        classificationData[teamA.id].empates++;
        classificationData[teamB.id].empates++;
        classificationData[teamA.id].pontos += 1;
        classificationData[teamB.id].pontos += 1;
      }

      // Create statistics for players in the match
      const playersA = await prisma.jogador.findMany({
        where: { timeId: teamA.id },
        take: 11
      });

      const playersB = await prisma.jogador.findMany({
        where: { timeId: teamB.id },
        take: 11
      });

      // Create escalacao for both teams
      for (const player of playersA) {
        await prisma.escalacao.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            timeId: teamA.id,
            titular: true
          }
        });

        // Create random statistics for the player
        const playerGoals = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;
        const assists = Math.random() > 0.85 ? Math.floor(Math.random() * 2) : 0;
        const yellowCards = Math.random() > 0.9 ? 1 : 0;
        const redCards = Math.random() > 0.99 ? 1 : 0;

        await prisma.estatistica.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            gols: playerGoals,
            assistencias: assists,
            cartoesAmarelos: yellowCards,
            cartoesVermelhos: redCards
          }
        });
      }

      for (const player of playersB) {
        await prisma.escalacao.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            timeId: teamB.id,
            titular: true
          }
        });

        // Create random statistics for the player
        const playerGoals = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;
        const assists = Math.random() > 0.85 ? Math.floor(Math.random() * 2) : 0;
        const yellowCards = Math.random() > 0.9 ? 1 : 0;
        const redCards = Math.random() > 0.99 ? 1 : 0;

        await prisma.estatistica.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            gols: playerGoals,
            assistencias: assists,
            cartoesAmarelos: yellowCards,
            cartoesVermelhos: redCards
          }
        });
      }

      matchesCreated++;
    }
    
    if (matchesCreated >= matchCount) break;
  }

  // Recalculate saldoGols for all teams
  for (const team of teams) {
    classificationData[team.id].saldoGols = 
      classificationData[team.id].golsPro - classificationData[team.id].golsContra;
  }

  // Create classification entries for championship 2025-2026
  for (const team of teams) {
    const stats = classificationData[team.id];
    await prisma.classificacao.create({
      data: {
        campeonatoId: championship20252026.id,
        timeId: team.id,
        pontos: stats.pontos,
        jogos: stats.jogos,
        vitorias: stats.vitorias,
        empates: stats.empates,
        derrotas: stats.derrotas,
        golsPro: stats.golsPro,
        golsContra: stats.golsContra,
        saldoGols: stats.saldoGols
      }
    });
  }

  // Create empty classification entries for championship 2026-2027
  for (const team of teams) {
    await prisma.classificacao.create({
      data: {
        campeonatoId: championship20262027.id,
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
  console.log(`   - 10 Times com nomes fictícios`);
  console.log(`   - 200-300 Jogadores (20-30 por time)`);
  console.log(`   - 2 Campeonatos: 2025-2026 (em andamento) e 2026-2027 (não iniciado)`);
  console.log(`   - 30 Partidas com placares e estatísticas (Campeonato 2025-2026)`);
  console.log(`   - Escalações e estatísticas de jogadores para cada partida`);
  console.log(`   - Classificação atualizada com todos os dados`);
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
