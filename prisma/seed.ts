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

  const admin = await prisma.usuario.create({
    data: {
      nome: 'Administrador',
      email: 'admin@ifut.com',
      senha: hashedPassword,
      tipo: 'administrador'
    }
  });

  const organizer1 = await prisma.usuario.create({
    data: {
      nome: 'Carlos Organizador',
      email: 'carlos@ifut.com',
      senha: hashedPassword,
      tipo: 'organizador'
    }
  });

  const organizer2 = await prisma.usuario.create({
    data: {
      nome: 'Maria Organizadora',
      email: 'maria@ifut.com',
      senha: hashedPassword,
      tipo: 'organizador'
    }
  });

  const tecnico1 = await prisma.usuario.create({
    data: {
      nome: 'João Técnico',
      email: 'joao@ifut.com',
      senha: hashedPassword,
      tipo: 'tecnico'
    }
  });

  const tecnico2 = await prisma.usuario.create({
    data: {
      nome: 'Pedro Técnico',
      email: 'pedro@ifut.com',
      senha: hashedPassword,
      tipo: 'tecnico'
    }
  });

  // Create teams
  console.log('⚽ Criando times...');
  const teams = await Promise.all([
    prisma.time.create({
      data: { nome: 'Atlético Sabará', cidade: 'Sabará', responsavelId: tecnico1.id }
    }),
    prisma.time.create({
      data: { nome: 'Estrela do Norte', cidade: 'Belo Horizonte', responsavelId: tecnico1.id }
    }),
    prisma.time.create({
      data: { nome: 'União FC', cidade: 'Contagem', responsavelId: tecnico2.id }
    }),
    prisma.time.create({
      data: { nome: 'Esperança EC', cidade: 'Betim', responsavelId: tecnico2.id }
    })
  ]);

  // Create players for each team
  console.log('🧑‍🤝‍🧑 Criando jogadores...');
  const posicoes = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante'];
  const players: any[] = [];

  for (const team of teams) {
    for (let i = 1; i <= 11; i++) {
      const player = await prisma.jogador.create({
        data: {
          nome: `Jogador ${i} - ${team.nome}`,
          apelido: `J${i}`,
          dataNascimento: new Date(`199${Math.floor(Math.random() * 10)}-0${Math.floor(Math.random() * 9) + 1}-15`),
          posicao: posicoes[Math.floor(Math.random() * posicoes.length)],
          numeroCamisa: i,
          documento: `${team.id}${i}`.padStart(11, '0'),
          timeId: team.id
        }
      });
      players.push(player);
    }
  }

  // Create championship
  console.log('🏆 Criando campeonato...');
  const championship = await prisma.campeonato.create({
    data: {
      nome: 'Campeonato Amador de Sabará 2025',
      descricao: 'Primeira edição do campeonato amador da região de Sabará',
      tipo: 'pontos_corridos',
      dataInicio: new Date('2025-03-01'),
      dataFim: new Date('2025-06-30'),
      limiteTimesMinimo: 4,
      limiteTimesMaximo: 8,
      inscricoesAbertas: false,
      organizadorId: organizer1.id
    }
  });

  if (AUTO_ENROLL_TEAMS) {
    // Create approved registrations and classifications
    console.log('📝 Criando inscrições aprovadas...');
    for (const team of teams) {
      await prisma.inscricao.create({
        data: {
          campeonatoId: championship.id,
          timeId: team.id,
          status: 'aprovada'
        }
      });

      await prisma.classificacao.create({
        data: {
          campeonatoId: championship.id,
          timeId: team.id
        }
      });
    }

    // Create 10 matches (different rounds and confrontos)
    console.log('📅 Criando 10 partidas...');
    const matchData = [
      // Rodada 1
      { timeCasaId: teams[0].id, timeVisitanteId: teams[1].id, rodada: 1, dataHora: new Date('2025-03-08T15:00:00'), status: 'finalizada' as const },
      { timeCasaId: teams[2].id, timeVisitanteId: teams[3].id, rodada: 1, dataHora: new Date('2025-03-08T17:00:00'), status: 'finalizada' as const },
      // Rodada 2
      { timeCasaId: teams[0].id, timeVisitanteId: teams[2].id, rodada: 2, dataHora: new Date('2025-03-15T15:00:00'), status: 'finalizada' as const },
      { timeCasaId: teams[1].id, timeVisitanteId: teams[3].id, rodada: 2, dataHora: new Date('2025-03-15T17:00:00'), status: 'finalizada' as const },
      // Rodada 3
      { timeCasaId: teams[0].id, timeVisitanteId: teams[3].id, rodada: 3, dataHora: new Date('2025-03-22T15:00:00'), status: 'finalizada' as const },
      { timeCasaId: teams[2].id, timeVisitanteId: teams[1].id, rodada: 3, dataHora: new Date('2025-03-22T17:00:00'), status: 'agendada' as const },
      // Rodada 4
      { timeCasaId: teams[1].id, timeVisitanteId: teams[0].id, rodada: 4, dataHora: new Date('2025-03-29T15:00:00'), status: 'agendada' as const },
      { timeCasaId: teams[3].id, timeVisitanteId: teams[2].id, rodada: 4, dataHora: new Date('2025-03-29T17:00:00'), status: 'agendada' as const },
      // Rodada 5
      { timeCasaId: teams[2].id, timeVisitanteId: teams[0].id, rodada: 5, dataHora: new Date('2025-04-05T15:00:00'), status: 'agendada' as const },
      { timeCasaId: teams[3].id, timeVisitanteId: teams[1].id, rodada: 5, dataHora: new Date('2025-04-05T17:00:00'), status: 'agendada' as const }
    ];

    const matches = [];
    for (const data of matchData) {
      const match = await prisma.partida.create({
        data: {
          campeonatoId: championship.id,
          ...data,
          local: 'Estádio Municipal de Sabará'
        }
      });
      matches.push(match);
    }

    // Register results for 5 matches with escalações and estatísticas
    console.log('📊 Registrando resultados das 5 primeiras partidas...');
    const results = [
      { matchIndex: 0, golsCasa: 2, golsVisitante: 1 },
      { matchIndex: 1, golsCasa: 1, golsVisitante: 1 },
      { matchIndex: 2, golsCasa: 3, golsVisitante: 0 },
      { matchIndex: 3, golsCasa: 2, golsVisitante: 2 },
      { matchIndex: 4, golsCasa: 1, golsVisitante: 0 }
    ];

    for (const result of results) {
      const match = matches[result.matchIndex];
      
      // Update match result
      await prisma.partida.update({
        where: { id: match.id },
        data: {
          golsTimeCasa: result.golsCasa,
          golsTimeVisitante: result.golsVisitante,
          status: 'finalizada'
        }
      });

      // Get players from both teams
      const homePlayers = players.filter(p => p.timeId === match.timeCasaId).slice(0, 5);
      const awayPlayers = players.filter(p => p.timeId === match.timeVisitanteId).slice(0, 5);

      // Create escalações
      for (const player of [...homePlayers, ...awayPlayers]) {
        await prisma.escalacao.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            timeId: player.timeId,
            titular: true
          }
        });
      }

      // Distribute goals among players
      let homeGoalsRemaining = result.golsCasa;
      let awayGoalsRemaining = result.golsVisitante;

      for (const player of homePlayers) {
        const gols = homeGoalsRemaining > 0 ? Math.min(Math.floor(Math.random() * 2) + 1, homeGoalsRemaining) : 0;
        homeGoalsRemaining -= gols;
        
        await prisma.estatistica.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            gols,
            assistencias: Math.floor(Math.random() * 2),
            cartoesAmarelos: Math.floor(Math.random() * 2),
            cartoesVermelhos: 0
          }
        });
      }

      // Make sure all home goals are assigned
      if (homeGoalsRemaining > 0 && homePlayers.length > 0) {
        await prisma.estatistica.update({
          where: { partidaId_jogadorId: { partidaId: match.id, jogadorId: homePlayers[0].id } },
          data: { gols: { increment: homeGoalsRemaining } }
        });
      }

      for (const player of awayPlayers) {
        const gols = awayGoalsRemaining > 0 ? Math.min(Math.floor(Math.random() * 2) + 1, awayGoalsRemaining) : 0;
        awayGoalsRemaining -= gols;
        
        await prisma.estatistica.create({
          data: {
            partidaId: match.id,
            jogadorId: player.id,
            gols,
            assistencias: Math.floor(Math.random() * 2),
            cartoesAmarelos: Math.floor(Math.random() * 2),
            cartoesVermelhos: 0
          }
        });
      }

      // Make sure all away goals are assigned
      if (awayGoalsRemaining > 0 && awayPlayers.length > 0) {
        await prisma.estatistica.update({
          where: { partidaId_jogadorId: { partidaId: match.id, jogadorId: awayPlayers[0].id } },
          data: { gols: { increment: awayGoalsRemaining } }
        });
      }
    }

    // Update classifications based on results
    console.log('📈 Atualizando classificações...');
    const standingsData = [
      // Team 0: 2 wins (6 pts), 6 goals pro, 1 contra = +5
      { teamId: teams[0].id, pontos: 9, jogos: 3, vitorias: 3, empates: 0, derrotas: 0, golsPro: 6, golsContra: 1, saldoGols: 5 },
      // Team 1: 1 draw, 1 loss = 1 pt
      { teamId: teams[1].id, pontos: 2, jogos: 3, vitorias: 0, empates: 2, derrotas: 1, golsPro: 5, golsContra: 5, saldoGols: 0 },
      // Team 2: 1 draw, 1 loss = 1 pt
      { teamId: teams[2].id, pontos: 1, jogos: 2, vitorias: 0, empates: 1, derrotas: 1, golsPro: 1, golsContra: 4, saldoGols: -3 },
      // Team 3: 1 draw, 1 loss = 1 pt
      { teamId: teams[3].id, pontos: 1, jogos: 2, vitorias: 0, empates: 1, derrotas: 1, golsPro: 3, golsContra: 5, saldoGols: -2 }
    ];

    for (const standing of standingsData) {
      await prisma.classificacao.update({
        where: {
          campeonatoId_timeId: { campeonatoId: championship.id, timeId: standing.teamId }
        },
        data: {
          pontos: standing.pontos,
          jogos: standing.jogos,
          vitorias: standing.vitorias,
          empates: standing.empates,
          derrotas: standing.derrotas,
          golsPro: standing.golsPro,
          golsContra: standing.golsContra,
          saldoGols: standing.saldoGols
        }
      });
    }
  } else {
    console.log('⏭️ Pulando inscrições, partidas e classificação iniciais para manter times sem campeonatos.');
  }
  let allTeamsForMataMata: any[] = [];

  // =============================================
  // CAMPEONATO MATA-MATA
  // =============================================
  console.log('🥊 Criando campeonato mata-mata...');

  if (AUTO_ENROLL_TEAMS) {
    // Create 4 additional teams for mata-mata
    const mataMataTeams = await Promise.all([
      prisma.time.create({
        data: { nome: 'Tigres FC', cidade: 'Sabará', responsavelId: tecnico1.id }
      }),
      prisma.time.create({
        data: { nome: 'Leões United', cidade: 'Belo Horizonte', responsavelId: tecnico1.id }
      }),
      prisma.time.create({
        data: { nome: 'Águias do Sul', cidade: 'Contagem', responsavelId: tecnico2.id }
      }),
      prisma.time.create({
        data: { nome: 'Falcões EC', cidade: 'Betim', responsavelId: tecnico2.id }
      })
    ]);

    // Create players for mata-mata teams
    for (const team of mataMataTeams) {
      for (let i = 1; i <= 11; i++) {
        await prisma.jogador.create({
          data: {
            nome: `Jogador ${i} - ${team.nome}`,
            apelido: `J${i}`,
            dataNascimento: new Date(`199${Math.floor(Math.random() * 10)}-0${Math.floor(Math.random() * 9) + 1}-15`),
            posicao: posicoes[Math.floor(Math.random() * posicoes.length)],
            numeroCamisa: i,
            documento: `MM${team.id}${i}`.padStart(11, '0'),
            timeId: team.id
          }
        });
      }
    }

    const mataMataChampionship = await prisma.campeonato.create({
      data: {
        nome: 'Copa Eliminatória 2025',
        descricao: 'Torneio eliminatório com 8 times',
        tipo: 'mata_mata',
        dataInicio: new Date('2025-04-01'),
        dataFim: new Date('2025-05-15'),
        limiteTimesMinimo: 4,
        limiteTimesMaximo: 16,
        inscricoesAbertas: false,
        organizadorId: organizer1.id
      }
    });

    // Register all 8 teams (original 4 + mata-mata 4)
    allTeamsForMataMata = [...teams, ...mataMataTeams];
    for (const team of allTeamsForMataMata) {
      await prisma.inscricao.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          timeId: team.id,
          status: 'aprovada'
        }
      });
    }

    // Create phases: Quartas, Semi, Final
    const quartas = await prisma.fase.create({
      data: {
        campeonatoId: mataMataChampionship.id,
        nome: 'Quartas de final',
        ordem: 1
      }
    });

    const semi = await prisma.fase.create({
      data: {
        campeonatoId: mataMataChampionship.id,
        nome: 'Semi-final',
        ordem: 2
      }
    });

    const final = await prisma.fase.create({
      data: {
        campeonatoId: mataMataChampionship.id,
        nome: 'Final',
        ordem: 3
      }
    });

    // Create quarter-final matches
    const quartasMatches = await Promise.all([
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: quartas.id,
          timeCasaId: allTeamsForMataMata[0].id,
          timeVisitanteId: allTeamsForMataMata[7].id,
          rodada: 1,
          dataHora: new Date('2025-04-05T15:00:00'),
          local: 'Estádio Municipal',
          status: 'finalizada',
          golsTimeCasa: 2,
          golsTimeVisitante: 1
        }
      }),
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: quartas.id,
          timeCasaId: allTeamsForMataMata[1].id,
          timeVisitanteId: allTeamsForMataMata[6].id,
          rodada: 1,
          dataHora: new Date('2025-04-05T17:00:00'),
          local: 'Estádio Municipal',
          status: 'finalizada',
          golsTimeCasa: 3,
          golsTimeVisitante: 2
        }
      }),
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: quartas.id,
          timeCasaId: allTeamsForMataMata[2].id,
          timeVisitanteId: allTeamsForMataMata[5].id,
          rodada: 1,
          dataHora: new Date('2025-04-06T15:00:00'),
          local: 'Estádio Municipal',
          status: 'finalizada',
          golsTimeCasa: 1,
          golsTimeVisitante: 0
        }
      }),
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: quartas.id,
          timeCasaId: allTeamsForMataMata[3].id,
          timeVisitanteId: allTeamsForMataMata[4].id,
          rodada: 1,
          dataHora: new Date('2025-04-06T17:00:00'),
          local: 'Estádio Municipal',
          status: 'finalizada',
          golsTimeCasa: 2,
          golsTimeVisitante: 2
        }
      })
    ]);

    // Create semi-final matches (winners: teams 0, 1, 2, 3)
    const semiMatches = await Promise.all([
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: semi.id,
          timeCasaId: allTeamsForMataMata[0].id,
          timeVisitanteId: allTeamsForMataMata[1].id,
          rodada: 2,
          dataHora: new Date('2025-04-12T15:00:00'),
          local: 'Estádio Municipal',
          status: 'agendada'
        }
      }),
      prisma.partida.create({
        data: {
          campeonatoId: mataMataChampionship.id,
          faseId: semi.id,
          timeCasaId: allTeamsForMataMata[2].id,
          timeVisitanteId: allTeamsForMataMata[3].id,
          rodada: 2,
          dataHora: new Date('2025-04-12T17:00:00'),
          local: 'Estádio Municipal',
          status: 'agendada'
        }
      })
    ]);

    // Create final match (placeholder)
    await prisma.partida.create({
      data: {
        campeonatoId: mataMataChampionship.id,
        faseId: final.id,
        timeCasaId: allTeamsForMataMata[0].id,
        timeVisitanteId: allTeamsForMataMata[2].id,
        rodada: 3,
        dataHora: new Date('2025-04-19T16:00:00'),
        local: 'Estádio Municipal',
        status: 'agendada'
      }
    });
  } else {
    console.log('⏭️ Pulando inscrição automática no campeonato mata-mata.');
  }

  // =============================================
  // CAMPEONATO MISTO (GRUPOS + MATA-MATA)
  // =============================================
  console.log('🌍 Criando campeonato misto...');

  const mistoChampionship = await prisma.campeonato.create({
    data: {
      nome: 'Copa Regional 2025',
      descricao: 'Campeonato misto com fase de grupos e mata-mata',
      tipo: 'misto',
      dataInicio: new Date('2025-05-01'),
      dataFim: new Date('2025-07-30'),
      limiteTimesMinimo: 8,
      limiteTimesMaximo: 16,
      inscricoesAbertas: false,
      organizadorId: organizer2.id
    }
  });
  if (AUTO_ENROLL_TEAMS) {
    // Create 2 groups
    const grupoA = await prisma.grupo.create({
      data: {
        campeonatoId: mistoChampionship.id,
        nome: 'Grupo A'
      }
    });

    const grupoB = await prisma.grupo.create({
      data: {
        campeonatoId: mistoChampionship.id,
        nome: 'Grupo B'
      }
    });

    // Distribute teams: first 4 in Group A, next 4 in Group B
    const groupATeams = allTeamsForMataMata.slice(0, 4);
    const groupBTeams = allTeamsForMataMata.slice(4, 8);

    for (const team of groupATeams) {
      await prisma.inscricao.create({
        data: {
          campeonatoId: mistoChampionship.id,
          timeId: team.id,
          grupoId: grupoA.id,
          status: 'aprovada'
        }
      });

      await prisma.classificacao.create({
        data: {
          campeonatoId: mistoChampionship.id,
          timeId: team.id,
          pontos: Math.floor(Math.random() * 10),
          jogos: 3,
          vitorias: Math.floor(Math.random() * 3),
          empates: Math.floor(Math.random() * 2),
          derrotas: Math.floor(Math.random() * 3),
          golsPro: Math.floor(Math.random() * 8),
          golsContra: Math.floor(Math.random() * 6),
          saldoGols: Math.floor(Math.random() * 5) - 2
        }
      });
    }

    for (const team of groupBTeams) {
      await prisma.inscricao.create({
        data: {
          campeonatoId: mistoChampionship.id,
          timeId: team.id,
          grupoId: grupoB.id,
          status: 'aprovada'
        }
      });

      await prisma.classificacao.create({
        data: {
          campeonatoId: mistoChampionship.id,
          timeId: team.id,
          pontos: Math.floor(Math.random() * 10),
          jogos: 3,
          vitorias: Math.floor(Math.random() * 3),
          empates: Math.floor(Math.random() * 2),
          derrotas: Math.floor(Math.random() * 3),
          golsPro: Math.floor(Math.random() * 8),
          golsContra: Math.floor(Math.random() * 6),
          saldoGols: Math.floor(Math.random() * 5) - 2
        }
      });
    }

    // Create group stage matches (round-robin within each group)
    // Group A matches
    let matchDate = new Date('2025-05-03T15:00:00');
    for (let i = 0; i < groupATeams.length; i++) {
      for (let j = i + 1; j < groupATeams.length; j++) {
        await prisma.partida.create({
          data: {
            campeonatoId: mistoChampionship.id,
            grupoId: grupoA.id,
            timeCasaId: groupATeams[i].id,
            timeVisitanteId: groupATeams[j].id,
            rodada: 1,
            dataHora: matchDate,
            local: 'Estádio Regional',
            status: 'finalizada',
            golsTimeCasa: Math.floor(Math.random() * 4),
            golsTimeVisitante: Math.floor(Math.random() * 3)
          }
        });
        matchDate = new Date(matchDate.getTime() + 86400000);
      }
    }

    // Group B matches
    for (let i = 0; i < groupBTeams.length; i++) {
      for (let j = i + 1; j < groupBTeams.length; j++) {
        await prisma.partida.create({
          data: {
            campeonatoId: mistoChampionship.id,
            grupoId: grupoB.id,
            timeCasaId: groupBTeams[i].id,
            timeVisitanteId: groupBTeams[j].id,
            rodada: 1,
            dataHora: matchDate,
            local: 'Estádio Regional',
            status: 'finalizada',
            golsTimeCasa: Math.floor(Math.random() * 4),
            golsTimeVisitante: Math.floor(Math.random() * 3)
          }
        });
        matchDate = new Date(matchDate.getTime() + 86400000);
      }
    }
  } else {
    console.log('⏭️ Pulando inscrição automática no campeonato misto.');
  }

  console.log('✅ Seed concluído com sucesso!');
  console.log(`
📊 Dados criados:
- 5 usuários (1 admin, 2 organizadores, 2 técnicos)
- Times: ${AUTO_ENROLL_TEAMS ? '12 (8 liga + 4 mata-mata)' : '8 iniciais sem inscrições'}
- Jogadores: ${AUTO_ENROLL_TEAMS ? '88 liga + 44 mata-mata = 132' : '88 iniciais (11 por time)'}
- Campeonatos: 3 criados
  • Pontos Corridos${AUTO_ENROLL_TEAMS ? ' (com partidas e classificação)' : ' (sem inscrições iniciais)'}
  • Mata-Mata${AUTO_ENROLL_TEAMS ? ' (com fases/chaveamento)' : ' (vazio por padrão)'}
  • Misto${AUTO_ENROLL_TEAMS ? ' (com grupos e partidas)' : ' (sem grupos/inscrições iniciais)'}

🔑 Credenciais de acesso:
- Admin: admin@ifut.com / senha123
- Organizador: carlos@ifut.com / senha123
- Técnico: joao@ifut.com / senha123
  `);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
