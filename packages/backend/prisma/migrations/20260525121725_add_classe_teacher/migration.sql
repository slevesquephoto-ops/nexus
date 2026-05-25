/*
  Warnings:

  - Added the required column `teacherId` to the `Classe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Classe" ADD COLUMN     "teacherId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Classe" ADD CONSTRAINT "Classe_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
