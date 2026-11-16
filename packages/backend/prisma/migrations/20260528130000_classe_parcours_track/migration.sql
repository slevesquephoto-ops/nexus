-- CreateTable
CREATE TABLE "ClasseParcoursTrack" (
    "classeId"   TEXT NOT NULL,
    "parcoursId" TEXT NOT NULL,
    "trackId"    TEXT NOT NULL,
    CONSTRAINT "ClasseParcoursTrack_pkey" PRIMARY KEY ("classeId","parcoursId","trackId")
);

-- AddForeignKey
ALTER TABLE "ClasseParcoursTrack" ADD CONSTRAINT "ClasseParcoursTrack_classeId_fkey"
  FOREIGN KEY ("classeId") REFERENCES "Classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasseParcoursTrack" ADD CONSTRAINT "ClasseParcoursTrack_parcoursId_fkey"
  FOREIGN KEY ("parcoursId") REFERENCES "Parcours"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClasseParcoursTrack" ADD CONSTRAINT "ClasseParcoursTrack_trackId_fkey"
  FOREIGN KEY ("trackId") REFERENCES "Track"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
