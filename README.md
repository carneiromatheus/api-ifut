# iFut Backend - Sistema de Gestão para Campeonatos de Futebol Amador

Sistema desenvolvido como projeto acadêmico do IFMG Campus Sabará.

## 🚀 Stack Tecnológica

- **Runtime:** Node.js 20.x
- **Framework:** Express + TypeScript
- **ORM:** Prisma 5.x
- **Banco de Dados:** PostgreSQL 16.x
- **Testes:** Jest + Faker
- **Autenticação:** JWT (JSON Web Tokens)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Gerar cliente Prisma
npm run prisma:generate

# Executar migrações
npm run prisma:migrate

# Popular banco com dados de teste
npm run seed

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Executar apenas testes unitários
npm run test:unit

# Executar apenas testes de integração
npm run test:integration

# Executar testes com watch mode
npm run test:watch
```

## 📚 Documentação da API

### Padrão de Resposta

**Sucesso:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Erro:**
```json
{
  "success": false,
  "error": "Mensagem de erro"
}
```

---

## 🔐 Autenticação (`/api/auth`)

### POST `/api/auth/register`
Registra um novo usuário.

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "senha123",
  "tipo": "organizador"
}
```

**Tipos disponíveis:** `administrador`, `organizador`, `tecnico`

---

### POST `/api/auth/login`
Autentica um usuário.

**Body:**
```json
{
  "email": "joao@email.com",
  "senha": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "nome": "João", "email": "joao@email.com", "tipo": "organizador" },
    "token": "eyJhbG..."
  }
}
```

---

### GET `/api/auth/me`
Obtém perfil do usuário autenticado.

🔒 **Autenticação:** Bearer Token

---

## ⚽ Times (`/api/teams`)

### GET `/api/teams`
Lista todos os times.

### GET `/api/teams/:id`
Obtém detalhes de um time.

### POST `/api/teams`
Cria um novo time.

🔒 **Autenticação:** Bearer Token (organizador, tecnico, administrador)

**Body:**
```json
{
  "nome": "Atlético Sabará",
  "cidade": "Sabará",
  "escudo": "url_da_imagem",
  "fundadoEm": "2020-01-15"
}
```

### PUT `/api/teams/:id`
Atualiza um time.

🔒 **Autenticação:** Bearer Token (apenas responsável)

### DELETE `/api/teams/:id`
Remove um time.

🔒 **Autenticação:** Bearer Token (apenas responsável)

---

## 🧑‍🤝‍🧑 Jogadores (`/api/players`)

### GET `/api/players`
Lista jogadores.

**Query Params:** `timeId` (opcional)

### GET `/api/players/:id`
Obtém detalhes de um jogador.

### POST `/api/players`
Cria um novo jogador.

🔒 **Autenticação:** Bearer Token (apenas responsável do time)

**Body:**
```json
{
  "nome": "Carlos Silva",
  "apelido": "Carlão",
  "dataNascimento": "1995-03-20",
  "posicao": "Atacante",
  "numeroCamisa": 9,
  "documento": "12345678901",
  "timeId": 1
}
```

### PUT `/api/players/:id`
Atualiza um jogador.

🔒 **Autenticação:** Bearer Token (apenas responsável do time)

### DELETE `/api/players/:id`
Remove (desativa) um jogador.

🔒 **Autenticação:** Bearer Token (apenas responsável do time)

---

## 🏆 Campeonatos (`/api/championships`)

### GET `/api/championships`
Lista todos os campeonatos.

### GET `/api/championships/:id`
Obtém detalhes de um campeonato.

### POST `/api/championships`
Cria um novo campeonato.

🔒 **Autenticação:** Bearer Token (organizador, administrador)

**Body:**
```json
{
  "nome": "Campeonato Amador 2025",
  "descricao": "Primeira edição",
  "tipo": "pontos_corridos",
  "dataInicio": "2025-03-01",
  "dataFim": "2025-06-30",
  "limiteTimesMinimo": 4,
  "limiteTimesMaximo": 16
}
```

**Tipos de Campeonato:**
- `pontos_corridos` - Todos jogam contra todos, classificação por pontos
- `mata_mata` - Eliminatórias com fases (Quartas, Semi, Final)
- `misto` - Fase de grupos + mata-mata (estilo Copa do Mundo)

### PUT `/api/championships/:id`
Atualiza um campeonato.

🔒 **Autenticação:** Bearer Token (apenas organizador dono)

### DELETE `/api/championships/:id`
Remove um campeonato.

🔒 **Autenticação:** Bearer Token (apenas organizador dono)

---

## 📝 Inscrições (`/api/registrations`)

### GET `/api/registrations/championship/:campeonatoId`
Lista inscrições de um campeonato.

### POST `/api/registrations`
Inscreve um time em um campeonato.

🔒 **Autenticação:** Bearer Token (apenas responsável do time)

**Body:**
```json
{
  "campeonatoId": 1,
  "timeId": 1
}
```

### PATCH `/api/registrations/:id/approve`
Aprova uma inscrição.

🔒 **Autenticação:** Bearer Token (apenas organizador do campeonato)

### PATCH `/api/registrations/:id/reject`
Rejeita uma inscrição.

🔒 **Autenticação:** Bearer Token (apenas organizador do campeonato)

**Body:**
```json
{
  "motivo": "Documentação incompleta"
}
```

---

## 📅 Partidas (`/api/matches`)

### POST `/api/matches`
Cria uma nova partida.

🔒 **Autenticação:** Bearer Token (organizador, administrador)

**Regras de Negócio:**
- **RN11:** Apenas organizador dono pode criar partidas
- **RN12:** Apenas times inscritos e aprovados podem jogar

**Body:**
```json
{
  "campeonatoId": 1,
  "timeCasaId": 1,
  "timeVisitanteId": 2,
  "rodada": 1,
  "dataHora": "2025-03-08T15:00:00Z",
  "local": "Estádio Municipal"
}
```

**Validações:**
- Times devem estar inscritos e aprovados no campeonato
- Não permite duplicar confronto na mesma rodada
- Times da casa e visitante devem ser diferentes

---

### GET `/api/championships/:id/matches`
Lista partidas de um campeonato.

**Query Params:**
- `status` - Filtrar por status (`agendada`, `em_andamento`, `finalizada`, `cancelada`)
- `rodada` - Filtrar por rodada (número)

**Exemplo:**
```
GET /api/championships/1/matches?rodada=1&status=agendada
```

---

### GET `/api/matches/:id`
Obtém detalhes de uma partida, incluindo escalações e estatísticas.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "rodada": 1,
    "dataHora": "2025-03-08T15:00:00Z",
    "status": "finalizada",
    "golsTimeCasa": 2,
    "golsTimeVisitante": 1,
    "timeCasa": { "id": 1, "nome": "Time A" },
    "timeVisitante": { "id": 2, "nome": "Time B" },
    "escalacoes": [...],
    "estatisticas": [...]
  }
}
```

---

## 📊 Resultados (`/api/matches/:id/result`)

### PATCH `/api/matches/:id/result`
Registra o resultado de uma partida.

🔒 **Autenticação:** Bearer Token (organizador, administrador)

**Regras de Negócio:**
- **RN13:** Apenas organizador dono pode registrar resultados
- **RN14:** Classificação atualizada automaticamente após resultado
- **RN15:** Soma de gols individuais deve ser igual ao placar
- **RN16:** Jogador não pode estar duas vezes na escalação

**Body:**
```json
{
  "golsTimeCasa": 3,
  "golsTimeVisitante": 1,
  "escalacoes": [
    { "jogadorId": 1, "timeId": 1, "titular": true },
    { "jogadorId": 2, "timeId": 1, "titular": true },
    { "jogadorId": 10, "timeId": 2, "titular": true }
  ],
  "estatisticas": [
    { "jogadorId": 1, "gols": 2, "assistencias": 1, "cartoesAmarelos": 0, "cartoesVermelhos": 0 },
    { "jogadorId": 2, "gols": 1, "assistencias": 0, "cartoesAmarelos": 1, "cartoesVermelhos": 0 },
    { "jogadorId": 10, "gols": 1, "assistencias": 0, "cartoesAmarelos": 0, "cartoesVermelhos": 0 }
  ]
}
```

**Validações:**
- Partida deve estar com status `agendada` ou `em_andamento`
- Jogadores devem pertencer aos times da partida
- Cartões amarelos: 0-2 por jogador
- Cartões vermelhos: 0-1 por jogador

---

## 📈 Classificação (`/api/championships/:id/standings`)

### GET `/api/championships/:id/standings`
Obtém a classificação de um campeonato.

**Lógica de Pontos Corridos:**
- Vitória = 3 pontos
- Empate = 1 ponto
- Derrota = 0 pontos

**Critérios de Desempate (ordem):**
1. Pontos
2. Vitórias
3. Saldo de gols
4. Gols pró

**Resposta:**
```json
{
  "success": true,
  "data": {
    "classificacao": [
      {
        "posicao": 1,
        "timeId": 1,
        "nomeTime": "Atlético Sabará",
        "pontos": 9,
        "jogos": 3,
        "vitorias": 3,
        "empates": 0,
        "derrotas": 0,
        "golsPro": 8,
        "golsContra": 2,
        "saldoGols": 6
      },
      ...
    ]
  }
}
```

---

## 🥊 Chaveamento Mata-Mata (`/api/championships/:id/bracket`)

### POST `/api/championships/:id/bracket`
Cria o chaveamento automático para campeonatos tipo mata-mata.

🔒 **Autenticação:** Bearer Token (organizador dono)

**Requisitos:**
- Campeonato deve ser tipo `mata_mata`
- Número de times aprovados deve ser potência de 2 (4, 8, 16, 32)
- Chaveamento ainda não pode ter sido criado

**Resposta:**
```json
{
  "success": true,
  "data": {
    "fases": [
      { "id": 1, "nome": "Quartas de final", "ordem": 1 },
      { "id": 2, "nome": "Semi-final", "ordem": 2 },
      { "id": 3, "nome": "Final", "ordem": 3 }
    ],
    "partidas": [...]
  }
}
```

---

### GET `/api/championships/:id/bracket`
Obtém o chaveamento do campeonato mata-mata.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "campeonato": { "id": 1, "nome": "Copa Eliminatória" },
    "fases": [
      {
        "id": 1,
        "nome": "Quartas de final",
        "partidas": [
          {
            "id": 1,
            "timeCasa": { "id": 1, "nome": "Time A" },
            "timeVisitante": { "id": 2, "nome": "Time B" },
            "golsTimeCasa": 2,
            "golsTimeVisitante": 1,
            "status": "finalizada",
            "vencedor": { "id": 1, "nome": "Time A" }
          }
        ]
      }
    ]
  }
}
```

---

### POST `/api/matches/:id/advance`
Avança o vencedor de uma partida mata-mata para a próxima fase.

🔒 **Autenticação:** Bearer Token (organizador)

---

## 🌍 Grupos - Campeonato Misto (`/api/championships/:id/groups`)

### POST `/api/championships/:id/groups`
Cria grupos para campeonato tipo misto.

🔒 **Autenticação:** Bearer Token (organizador dono)

**Body:**
```json
{
  "numGroups": 4
}
```

**Requisitos:**
- Campeonato deve ser tipo `misto`
- Número de times deve ser divisível pelo número de grupos

---

### GET `/api/championships/:id/groups`
Lista grupos com times e partidas.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "campeonato": { "id": 1, "nome": "Copa Regional" },
    "grupos": [
      {
        "id": 1,
        "nome": "Grupo A",
        "times": [...],
        "partidas": [...]
      }
    ]
  }
}
```

---

### GET `/api/championships/:id/groups/:groupId/standings`
Classificação de um grupo específico.

---

### POST `/api/championships/:id/knockout-phase`
Cria fase mata-mata com os classificados dos grupos.

🔒 **Autenticação:** Bearer Token (organizador dono)

**Body:**
```json
{
  "qualifiersPerGroup": 2
}
```

---

## 🏅 Estatísticas (`/api/championships/:id/top-scorers`)

### GET `/api/championships/:id/top-scorers`
Obtém os artilheiros do campeonato.

**Query Params:**
- `limit` - Número de jogadores retornados (padrão: 10)

**Exemplo:**
```
GET /api/championships/1/top-scorers?limit=5
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "artilheiros": [
      {
        "jogadorId": 1,
        "nomeJogador": "João Silva",
        "timeId": 1,
        "nomeTime": "Atlético Sabará",
        "gols": 12,
        "assistencias": 5,
        "jogos": 8
      },
      ...
    ]
  }
}
```

---

## 📊 Estatísticas Avançadas

### GET `/api/players/:id/stats`
Estatísticas completas de um jogador em todos os campeonatos.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "jogador": { "id": 1, "nome": "Gabriel Barbosa" },
    "estatisticasGerais": {
      "totalJogos": 45,
      "totalGols": 32,
      "totalAssistencias": 15,
      "cartoesAmarelos": 8,
      "cartoesVermelhos": 1,
      "mediaGolsPorJogo": 0.71
    },
    "porCampeonato": [
      {
        "campeonatoId": 1,
        "nomeCampeonato": "Campeonato 2024",
        "jogos": 10,
        "gols": 8,
        "assistencias": 3
      }
    ]
  }
}
```

---

### GET `/api/teams/:id/history`
Histórico de partidas de um time com paginação.

**Query Params:**
- `limit` - Limite de resultados (padrão: 10)
- `offset` - Offset para paginação (padrão: 0)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "time": { "id": 1, "nome": "Flamengo" },
    "historico": [
      {
        "partidaId": 1,
        "data": "2024-01-15",
        "campeonato": "Campeonato 2024",
        "adversario": "Palmeiras",
        "placarTime": 3,
        "placarAdversario": 1,
        "resultado": "vitoria"
      }
    ],
    "estatisticas": {
      "totalJogos": 45,
      "vitorias": 30,
      "empates": 10,
      "derrotas": 5,
      "golsPro": 85,
      "golsContra": 32
    }
  }
}
```

---

### GET `/api/teams/:id/vs/:id2`
Confronto direto entre dois times.

**Resposta:**
```json
{
  "success": true,
  "data": {
    "time1": { "id": 1, "nome": "Flamengo" },
    "time2": { "id": 2, "nome": "Palmeiras" },
    "confrontos": {
      "total": 10,
      "vitoriasTime1": 6,
      "empates": 2,
      "vitoriasTime2": 2,
      "golsTime1": 18,
      "golsTime2": 10
    },
    "ultimasPartidas": [...]
  }
}
```

---

## 📖 Documentação Swagger

A API possui documentação interativa completa via Swagger UI.

### Acessar Documentação
```
GET /api/doc
```

**URL:** http://localhost:3000/api/doc

A documentação inclui:
- Todos os ~45 endpoints da API
- Schemas de requisição/resposta
- Autenticação JWT (Bearer Token)
- Exemplos de uso
- Códigos de status

---

## 📋 Regras de Negócio

| Código | Descrição |
|--------|-----------|
| RN11 | Apenas organizador dono pode criar partidas |
| RN12 | Apenas times inscritos e aprovados podem jogar |
| RN13 | Apenas organizador dono pode registrar resultados |
| RN14 | Classificação deve ser atualizada automaticamente após cada resultado |
| RN15 | Soma de gols individuais deve ser igual ao placar da partida |
| RN16 | Jogador só pode estar em uma escalação por partida |

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais
- `usuarios` - Usuários do sistema
- `times` - Times cadastrados
- `jogadores` - Jogadores dos times
- `campeonatos` - Campeonatos criados
- `inscricoes` - Inscrições de times em campeonatos
- `partidas` - Partidas dos campeonatos
- `escalacoes` - Escalações das partidas
- `estatisticas` - Estatísticas individuais por partida
- `classificacoes` - Tabela de classificação

---

## 🔑 Credenciais de Teste (após seed)

| Tipo | Email | Senha |
|------|-------|-------|
| Administrador | admin@ifut.com | senha123 |
| Organizador | carlos@ifut.com | senha123 |
| Organizador | maria@ifut.com | senha123 |
| Técnico | joao@ifut.com | senha123 |
| Técnico | pedro@ifut.com | senha123 |

---

## 📁 Estrutura de Pastas

```
src/
├── modules/
│   ├── auth/
│   ├── teams/
│   ├── players/
│   ├── championships/
│   ├── registrations/
│   ├── matches/
│   ├── results/
│   ├── standings/
│   ├── statistics/
│   ├── bracket/          # Chaveamento mata-mata
│   └── groups/           # Grupos (misto)
├── middlewares/
├── utils/
├── prisma/
└── swagger.json          # Documentação API

tests/
├── unit/
│   ├── matches.test.ts
│   ├── results.test.ts
│   ├── standings.test.ts
│   ├── statistics.test.ts
│   ├── bracket.test.ts        # Testes mata-mata
│   ├── groups.test.ts         # Testes grupos
│   └── advanced-stats.test.ts # Testes estatísticas avançadas
└── integration/
    ├── matches-flow.test.ts
    ├── results-standings-flow.test.ts
    └── statistics-flow.test.ts
```

---

## 📄 Licença

MIT - IFMG Campus Sabará
