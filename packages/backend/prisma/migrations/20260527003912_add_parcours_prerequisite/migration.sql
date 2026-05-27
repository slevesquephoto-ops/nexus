-- AlterTable
ALTER TABLE "Parcours" ADD COLUMN     "prerequisiteId" TEXT;

-- AddForeignKey
ALTER TABLE "Parcours" ADD CONSTRAINT "Parcours_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Parcours"("id") ON DELETE SET NULL ON UPDATE CASCADE;
