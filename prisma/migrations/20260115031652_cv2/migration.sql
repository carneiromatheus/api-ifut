/*
  Warnings:

  - The values [misto] on the enum `TipoCampeonato` will be removed. If these variants are still used in the database, this will fail.
  - The values [jogador,comum] on the enum `TipoUsuario` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `created_at` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `logo_url` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `numero_grupos` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `regulamento` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `times_por_grupo` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `campeonatos` table. All the data in the column will be lost.
  - You are about to alter the column `nome` on the `campeonatos` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `grupo_id` on the `classificacoes` table. All the data in the column will be lost.
  - You are about to drop the column `posicao` on the `classificacoes` table. All the data in the column will be lost.
  - You are about to drop the column `data_inscricao` on the `inscricoes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `jogadores` table. All the data in the column will be lost.
  - You are about to drop the column `foto_url` on the `jogadores` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `jogadores` table. All the data in the column will be lost.
  - You are about to alter the column `nome` on the `jogadores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `created_at` on the `partidas` table. All the data in the column will be lost.
  - You are about to drop the column `fase_id` on the `partidas` table. All the data in the column will be lost.
  - You are about to drop the column `gols_casa` on the `partidas` table. All the data in the column will be lost.
  - You are about to drop the column `gols_visitante` on the `partidas` table. All the data in the column will be lost.
  - You are about to drop the column `grupo_id` on the `partidas` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `partidas` table. All the data in the column will be lost.
  - You are about to alter the column `local` on the `partidas` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `ano_fundacao` on the `times` table. All the data in the column will be lost.
  - You are about to drop the column `cores` on the `times` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `times` table. All the data in the column will be lost.
  - You are about to drop the column `criador_id` on the `times` table. All the data in the column will be lost.
  - You are about to drop the column `escudo_url` on the `times` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `times` table. All the data in the column will be lost.
  - You are about to alter the column `nome` on the `times` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the column `created_at` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `foto_url` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `google_id` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `usuarios` table. All the data in the column will be lost.
  - You are about to alter the column `nome` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to alter the column `email` on the `usuarios` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(100)`.
  - You are about to drop the `fases` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grupos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organizadores` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[campeonato_id,time_id]` on the table `classificacoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[partida_id,jogador_id]` on the table `escalacoes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[partida_id,jogador_id]` on the table `estatisticas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[documento]` on the table `jogadores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `atualizado_em` to the `campeonatos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizado_em` to the `classificacoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizado_em` to the `inscricoes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizado_em` to the `jogadores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `documento` to the `jogadores` table without a default value. This is not possible if the table is not empty.
  - Made the column `data_nascimento` on table `jogadores` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `posicao` on the `jogadores` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `atualizado_em` to the `partidas` table without a default value. This is not possible if the table is not empty.
  - Made the column `data_hora` on table `partidas` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rodada` on table `partidas` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `atualizado_em` to the `times` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cidade` to the `times` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsavel_id` to the `times` table without a default value. This is not possible if the table is not empty.
  - Added the required column `atualizado_em` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Made the column `senha` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoCampeonato_new" AS ENUM ('pontos_corridos', 'mata_mata', 'grupos');
ALTER TABLE "campeonatos" ALTER COLUMN "tipo" TYPE "TipoCampeonato_new" USING ("tipo"::text::"TipoCampeonato_new");
ALTER TYPE "TipoCampeonato" RENAME TO "TipoCampeonato_old";
ALTER TYPE "TipoCampeonato_new" RENAME TO "TipoCampeonato";
DROP TYPE "TipoCampeonato_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TipoUsuario_new" AS ENUM ('administrador', 'organizador', 'tecnico');
ALTER TABLE "usuarios" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "usuarios" ALTER COLUMN "tipo" TYPE "TipoUsuario_new" USING ("tipo"::text::"TipoUsuario_new");
ALTER TYPE "TipoUsuario" RENAME TO "TipoUsuario_old";
ALTER TYPE "TipoUsuario_new" RENAME TO "TipoUsuario";
DROP TYPE "TipoUsuario_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "campeonatos" DROP CONSTRAINT "campeonatos_organizador_id_fkey";

-- DropForeignKey
ALTER TABLE "classificacoes" DROP CONSTRAINT "classificacoes_campeonato_id_fkey";

-- DropForeignKey
ALTER TABLE "classificacoes" DROP CONSTRAINT "classificacoes_grupo_id_fkey";

-- DropForeignKey
ALTER TABLE "classificacoes" DROP CONSTRAINT "classificacoes_time_id_fkey";

-- DropForeignKey
ALTER TABLE "escalacoes" DROP CONSTRAINT "escalacoes_jogador_id_fkey";

-- DropForeignKey
ALTER TABLE "escalacoes" DROP CONSTRAINT "escalacoes_partida_id_fkey";

-- DropForeignKey
ALTER TABLE "escalacoes" DROP CONSTRAINT "escalacoes_time_id_fkey";

-- DropForeignKey
ALTER TABLE "estatisticas" DROP CONSTRAINT "estatisticas_jogador_id_fkey";

-- DropForeignKey
ALTER TABLE "estatisticas" DROP CONSTRAINT "estatisticas_partida_id_fkey";

-- DropForeignKey
ALTER TABLE "fases" DROP CONSTRAINT "fases_campeonato_id_fkey";

-- DropForeignKey
ALTER TABLE "grupos" DROP CONSTRAINT "grupos_fase_id_fkey";

-- DropForeignKey
ALTER TABLE "inscricoes" DROP CONSTRAINT "inscricoes_campeonato_id_fkey";

-- DropForeignKey
ALTER TABLE "inscricoes" DROP CONSTRAINT "inscricoes_time_id_fkey";

-- DropForeignKey
ALTER TABLE "jogadores" DROP CONSTRAINT "jogadores_time_id_fkey";

-- DropForeignKey
ALTER TABLE "organizadores" DROP CONSTRAINT "organizadores_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "partidas" DROP CONSTRAINT "partidas_campeonato_id_fkey";

-- DropForeignKey
ALTER TABLE "partidas" DROP CONSTRAINT "partidas_fase_id_fkey";

-- DropForeignKey
ALTER TABLE "partidas" DROP CONSTRAINT "partidas_grupo_id_fkey";

-- DropForeignKey
ALTER TABLE "partidas" DROP CONSTRAINT "partidas_time_casa_id_fkey";

-- DropForeignKey
ALTER TABLE "partidas" DROP CONSTRAINT "partidas_time_visitante_id_fkey";

-- DropForeignKey
ALTER TABLE "times" DROP CONSTRAINT "times_criador_id_fkey";

-- DropIndex
DROP INDEX "campeonatos_organizador_id_idx";

-- DropIndex
DROP INDEX "campeonatos_status_idx";

-- DropIndex
DROP INDEX "campeonatos_tipo_idx";

-- DropIndex
DROP INDEX "classificacoes_campeonato_id_idx";

-- DropIndex
DROP INDEX "classificacoes_campeonato_id_time_id_grupo_id_key";

-- DropIndex
DROP INDEX "classificacoes_time_id_idx";

-- DropIndex
DROP INDEX "escalacoes_jogador_id_idx";

-- DropIndex
DROP INDEX "escalacoes_partida_id_idx";

-- DropIndex
DROP INDEX "estatisticas_jogador_id_idx";

-- DropIndex
DROP INDEX "estatisticas_partida_id_idx";

-- DropIndex
DROP INDEX "inscricoes_campeonato_id_idx";

-- DropIndex
DROP INDEX "inscricoes_status_idx";

-- DropIndex
DROP INDEX "inscricoes_time_id_idx";

-- DropIndex
DROP INDEX "jogadores_posicao_idx";

-- DropIndex
DROP INDEX "jogadores_time_id_idx";

-- DropIndex
DROP INDEX "partidas_campeonato_id_idx";

-- DropIndex
DROP INDEX "partidas_status_idx";

-- DropIndex
DROP INDEX "partidas_time_casa_id_idx";

-- DropIndex
DROP INDEX "partidas_time_visitante_id_idx";

-- DropIndex
DROP INDEX "times_criador_id_idx";

-- DropIndex
DROP INDEX "usuarios_email_idx";

-- DropIndex
DROP INDEX "usuarios_google_id_key";

-- AlterTable
ALTER TABLE "campeonatos" DROP COLUMN "created_at",
DROP COLUMN "logo_url",
DROP COLUMN "numero_grupos",
DROP COLUMN "regulamento",
DROP COLUMN "status",
DROP COLUMN "times_por_grupo",
DROP COLUMN "updated_at",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "inscricoes_abertas" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "limite_times_maximo" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "limite_times_minimo" INTEGER NOT NULL DEFAULT 4,
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "tipo" SET DEFAULT 'pontos_corridos',
ALTER COLUMN "data_inicio" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "data_fim" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "classificacoes" DROP COLUMN "grupo_id",
DROP COLUMN "posicao",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "escalacoes" ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "estatisticas" ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "inscricoes" DROP COLUMN "data_inscricao",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "motivo_rejeicao" TEXT;

-- AlterTable
ALTER TABLE "jogadores" DROP COLUMN "created_at",
DROP COLUMN "foto_url",
DROP COLUMN "updated_at",
ADD COLUMN     "apelido" VARCHAR(50),
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "documento" VARCHAR(14) NOT NULL,
ADD COLUMN     "foto" VARCHAR(255),
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "data_nascimento" SET NOT NULL,
ALTER COLUMN "data_nascimento" SET DATA TYPE TIMESTAMP(3),
DROP COLUMN "posicao",
ADD COLUMN     "posicao" VARCHAR(30) NOT NULL;

-- AlterTable
ALTER TABLE "partidas" DROP COLUMN "created_at",
DROP COLUMN "fase_id",
DROP COLUMN "gols_casa",
DROP COLUMN "gols_visitante",
DROP COLUMN "grupo_id",
DROP COLUMN "updated_at",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gols_time_casa" INTEGER,
ADD COLUMN     "gols_time_visitante" INTEGER,
ALTER COLUMN "data_hora" SET NOT NULL,
ALTER COLUMN "local" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "rodada" SET NOT NULL;

-- AlterTable
ALTER TABLE "times" DROP COLUMN "ano_fundacao",
DROP COLUMN "cores",
DROP COLUMN "created_at",
DROP COLUMN "criador_id",
DROP COLUMN "escudo_url",
DROP COLUMN "updated_at",
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "cidade" VARCHAR(100) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "escudo" VARCHAR(255),
ADD COLUMN     "fundado_em" TIMESTAMP(3),
ADD COLUMN     "responsavel_id" INTEGER NOT NULL,
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "created_at",
DROP COLUMN "foto_url",
DROP COLUMN "google_id",
DROP COLUMN "updated_at",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "atualizado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "nome" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "senha" SET NOT NULL,
ALTER COLUMN "tipo" DROP DEFAULT;

-- DropTable
DROP TABLE "fases";

-- DropTable
DROP TABLE "grupos";

-- DropTable
DROP TABLE "organizadores";

-- DropEnum
DROP TYPE "Posicao";

-- DropEnum
DROP TYPE "StatusCampeonato";

-- DropEnum
DROP TYPE "TipoFase";

-- CreateTable
CREATE TABLE "auditoria_logs" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "acao" VARCHAR(50) NOT NULL,
    "tabela" VARCHAR(50) NOT NULL,
    "registro_id" INTEGER,
    "dados_antigos" JSONB,
    "dados_novos" JSONB,
    "ip" VARCHAR(45),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_sistema" (
    "id" SERIAL NOT NULL,
    "chave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" SERIAL NOT NULL,
    "titulo" VARCHAR(100) NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" VARCHAR(30) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "destinatario_id" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_sistema_chave_key" ON "configuracoes_sistema"("chave");

-- CreateIndex
CREATE UNIQUE INDEX "classificacoes_campeonato_id_time_id_key" ON "classificacoes"("campeonato_id", "time_id");

-- CreateIndex
CREATE UNIQUE INDEX "escalacoes_partida_id_jogador_id_key" ON "escalacoes"("partida_id", "jogador_id");

-- CreateIndex
CREATE UNIQUE INDEX "estatisticas_partida_id_jogador_id_key" ON "estatisticas"("partida_id", "jogador_id");

-- CreateIndex
CREATE UNIQUE INDEX "jogadores_documento_key" ON "jogadores"("documento");

-- AddForeignKey
ALTER TABLE "times" ADD CONSTRAINT "times_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jogadores" ADD CONSTRAINT "jogadores_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campeonatos" ADD CONSTRAINT "campeonatos_organizador_id_fkey" FOREIGN KEY ("organizador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_time_casa_id_fkey" FOREIGN KEY ("time_casa_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_time_visitante_id_fkey" FOREIGN KEY ("time_visitante_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escalacoes" ADD CONSTRAINT "escalacoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_partida_id_fkey" FOREIGN KEY ("partida_id") REFERENCES "partidas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estatisticas" ADD CONSTRAINT "estatisticas_jogador_id_fkey" FOREIGN KEY ("jogador_id") REFERENCES "jogadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacoes" ADD CONSTRAINT "classificacoes_time_id_fkey" FOREIGN KEY ("time_id") REFERENCES "times"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_logs" ADD CONSTRAINT "auditoria_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
