/*
  Warnings:

  - The values [grupos] on the enum `TipoCampeonato` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoCampeonato_new" AS ENUM ('pontos_corridos', 'mata_mata', 'misto');
ALTER TABLE "campeonatos" ALTER COLUMN "tipo" DROP DEFAULT;
ALTER TABLE "campeonatos" ALTER COLUMN "tipo" TYPE "TipoCampeonato_new" USING ("tipo"::text::"TipoCampeonato_new");
ALTER TYPE "TipoCampeonato" RENAME TO "TipoCampeonato_old";
ALTER TYPE "TipoCampeonato_new" RENAME TO "TipoCampeonato";
DROP TYPE "TipoCampeonato_old";
ALTER TABLE "campeonatos" ALTER COLUMN "tipo" SET DEFAULT 'pontos_corridos';
COMMIT;

-- AlterTable
ALTER TABLE "inscricoes" ADD COLUMN     "grupo_id" INTEGER;

-- AlterTable
ALTER TABLE "partidas" ADD COLUMN     "fase_id" INTEGER,
ADD COLUMN     "grupo_id" INTEGER;

-- CreateTable
CREATE TABLE "fases" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "ordem" INTEGER NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grupos" (
    "id" SERIAL NOT NULL,
    "campeonato_id" INTEGER NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grupos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "inscricoes" ADD CONSTRAINT "inscricoes_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_fase_id_fkey" FOREIGN KEY ("fase_id") REFERENCES "fases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partidas" ADD CONSTRAINT "partidas_grupo_id_fkey" FOREIGN KEY ("grupo_id") REFERENCES "grupos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fases" ADD CONSTRAINT "fases_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupos" ADD CONSTRAINT "grupos_campeonato_id_fkey" FOREIGN KEY ("campeonato_id") REFERENCES "campeonatos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
