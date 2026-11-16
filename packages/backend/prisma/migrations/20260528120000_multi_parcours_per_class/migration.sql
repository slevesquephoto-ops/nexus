-- CreateTable
CREATE TABLE "ClasseParcours" (
    "classeId" TEXT NOT NULL,
    "parcoursId" TEXT NOT NULL,
    CONSTRAINT "ClasseParcours_pkey" PRIMARY KEY ("classeId","parcoursId")
);

-- AddForeignKey
ALTER TABLE "ClasseParcours" ADD CONSTRAINT "ClasseParcours_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasseParcours" ADD CONSTRAINT "ClasseParcours_parcoursId_fkey" FOREIGN KEY ("parcoursId") REFERENCES "Parcours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateData: copy existing single parcours into the new join table
INSERT INTO "ClasseParcours" ("classeId", "parcoursId")
SELECT "id", "parcoursId" FROM "Classe" WHERE "parcoursId" IS NOT NULL;

-- AlterTable: remove the now-redundant parcoursId column from Classe
ALTER TABLE "Classe" DROP COLUMN "parcoursId";
