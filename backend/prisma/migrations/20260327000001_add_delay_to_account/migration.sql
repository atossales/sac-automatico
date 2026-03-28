-- AlterTable: adiciona campos de delay para simulação de digitação humana
ALTER TABLE "Account" ADD COLUMN "delayMin" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Account" ADD COLUMN "delayMax" INTEGER NOT NULL DEFAULT 12;
