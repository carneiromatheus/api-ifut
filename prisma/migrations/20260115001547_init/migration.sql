-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('organizador', 'jogador', 'comum');

-- CreateEnum
CREATE TYPE "Posicao" AS ENUM ('Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante');

-- CreateEnum
CREATE TYPE "TipoCampeonato" AS ENUM ('pontos_corridos', 'mata_mata', 'misto');

-- CreateEnum
CREATE TYPE "StatusCampeonato" AS ENUM ('aberto', 'em_andamento', 'encerrado', 'cancelado');

-- CreateEnum
CREATE TYPE "StatusInscricao" AS ENUM ('pendente', 'aprovada', 'rejeitada');

-- CreateEnum
CREATE TYPE "StatusPartida" AS ENUM ('agendada', 'em_andamento', 'finalizada', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoFase" AS ENUM ('grupos', 'eliminatoria');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "senha" VARCHAR(255),
    "tipo" "TipoUsuario" NOT NULL DEFAULT 'comum',
    "foto_url" VARCHAR(500),
    "google_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizadores" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "times" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "escudo_url" VARCHAR(500),
    "ano_fundacao" INTEGER,
    "cores" JSONB,
    "criador_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jogadores" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "data_nascimento" DATE,
    "posicao" "Posicao" NOT NULL,
    "numero_camisa" INTEGER NOT NULL,
    "foto_url" VARCHAR(500),
    "time_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jogadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoCampeonato" NOT NULL,
    "data_inicio" DATE NOT NULL,
    "data_fim" DATE,
    "status" "StatusCampeonato" NOT NULL DEFAULT 'aberto',
    "regulamento" TEXT,
    "logo_url" VARCHAR(500),
    "organizador_id" INTEGER NOT NULL,
    "numero_grupos" INTEGER,
    "times_por_grupo" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campeonatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "time_id" INTEGER NOT NULL,
    "status" "StatusInscricao" NOT NULL DEFAULT 'pendente',
    "data_inscricao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inscricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fases" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "tipo" "TipoFase" NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "fases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" SERIAL NOT NULL,
    "fase_id" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partidas" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "time_casa_id" INTEGER NOT NULL,
    "time_visitante_id" INTEGER NOT NULL,
    "data_hora" TIMESTAMP(3),
    "local" VARCHAR(255),
    "rodada" INTEGER,
    "fase_id" INTEGER,
    "grupo_id" INTEGER,
    "gols_casa" INTEGER NOT NULL DEFAULT 0,
    "gols_visitante" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusPartida" NOT NULL DEFAULT 'agendada',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escalacoes" (
    "id" SERIAL NOT NULL,
    "partida_id" INTEGER NOT NULL,
    "jogador_id" INTEGER NOT NULL,
    "time_id" INTEGER NOT NULL,
    "titular" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "escalacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estatisticas" (
    "id" SERIAL NOT NULL,
    "partida_id" INTEGER NOT NULL,
    "jogador_id" INTEGER NOT NULL,
    "gols" INTEGER NOT NULL DEFAULT 0,
    "assistencias" INTEGER NOT NULL DEFAULT 0,
    "cartoes_amarelos" INTEGER NOT NULL DEFAULT 0,
    "cartoes_vermelhos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "estatisticas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classificacoes" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "time_id" INTEGER NOT NULL,
    "grupo_id" INTEGER,
    "posicao" INTEGER NOT NULL DEFAULT 0,
    "pontos" INTEGER NOT NULL DEFAULT 0,
    "jogos" INTEGER NOT NULL DEFAULT 0,
    "vitorias" INTEGER NOT NULL DEFAULT 0,
    "empates" INTEGER NOT NULL DEFAULT 0,
    "derrotas" INTEGER NOT NULL DEFAULT 0,
    "gols_pro" INTEGER NOT NULL DEFAULT 0,
    "gols_contra" INTEGER NOT NULL DEFAULT 0,
    "saldo_gols" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "classificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_google_id_key" ON "usuarios"("google_id");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "organizadores_usuario_id_key" ON "organizadores"("usuario_id");

-- CreateIndex
CREATE INDEX "times_criador_id_idx" ON "times"("criador_id");

-- CreateIndex
CREATE INDEX "jogadores_time_id_idx" ON "jogadores"("time_id");

-- CreateIndex
CREATE INDEX "jogadores_posicao_idx" ON "jogadores"("posicao");

-- CreateIndex
CREATE INDEX "campeonatos_organizador_id_idx" ON "campeonatos"("organizador_id");

-- CreateIndex
CREATE INDEX "campeonatos_status_idx" ON "campeonatos"("status");

-- CreateIndex
CREATE INDEX "campeonatos_tipo_idx" ON "campeonatos"("tipo");

-- CreateIndex
CREATE INDEX "inscricoes_campeonato_id_idx" ON "inscricoes"("campeonato_id");

-- CreateIndex
CREATE INDEX "inscricoes_time_id_idx" ON "inscricoes"("time_id");

-- CreateIndex
CREATE INDEX "inscricoes_status_idx" ON "inscricoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_campeonato_id_time_id_key" ON "inscricoes"("campeonato_id", "time_id");

-- CreateIndex
CREATE INDEX "fases_campeonato_id_idx" ON "fases"("campeonato_id");

-- CreateIndex
CREATE INDEX "grupos_fase_id_idx" ON "grupos"("fase_id");

-- CreateIndex
CREATE INDEX "partidas_campeonato_id_idx" ON "partidas"("campeonato_id");

-- CreateIndex
CREATE INDEX "partidas_time_casa_id_idx" ON "partidas"("time_casa_id");

-- CreateIndex
CREATE INDEX "partidas_time_visitante_id_idx" ON "partidas"("time_visitante_id");

-- CreateIndex
CREATE INDEX "partidas_status_idx" ON "partidas"("status");

-- CreateIndex
CREATE INDEX "escalacoes_partida_id_idx" ON "escalacoes"("partida_id");

-- CreateIndex
CREATE INDEX "escalacoes_jogador_id_idx" ON "escalacoes"("jogador_id");

-- CreateIndex
CREATE INDEX "estatisticas_partida_id_idx" ON "estatisticas"("partida_id");

-- CreateIndex
CREATE INDEX "estatisticas_jogador_id_idx" ON "estatisticas"("jogador_id");

-- CreateIndex
CREATE INDEX "classificacoes_campeonato_id_idx" ON "classificacoes"("campeonato_id");

-- CreateIndex
CREATE INDEX "classificacoes_time_id_idx" ON "classificacoes"("time_id");

-- CreateIndex
CREATE UNIQUE INDEX "classificacoes_campeonato_id_time_id_grupo_id_key" ON "classificacoes"("campeonato_id", "time_id", "grupo_id");

-- AddForeignKey
ALTER TABLE "organizadores" ADD CONSTRAINT "organizadores_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "times" ADD CONSTRAINT "times_criador_id_fkey" FOREIGN KEY ("criador_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campeonatos" ADD CONSTRAINT "campeonatos_organizador_id_fkey" FOREIGN KEY ("organizador_id") REFERENCES "organizadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fases" ADD CONSTRAINT "fases_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_time_casa_id_fkey" FOREIGN KEY ("time_casa_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_time_visitante_id_fkey" FOREIGN KEY ("time_visitante_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
