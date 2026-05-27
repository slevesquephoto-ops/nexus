const prisma = require('./src/lib/prisma');

async function main() {
  // Parcours
  await prisma.parcours.update({ where: { id: 'comp10' }, data: { title: 'Compétence 10' } });
  console.log('✓ Parcours comp10 → "Compétence 10"');

  // Tracks
  await prisma.track.update({ where: { id: 'linux' }, data: { title: 'Linux Fundamentals' } });
  console.log('✓ Track linux → "Linux Fundamentals"');

  // Modules
  await prisma.module.update({ where: { id: 'linux-fund-1' }, data: { title: 'Linux Fundamentals 1' } });
  console.log('✓ Module linux-fund-1 → "Linux Fundamentals 1"');

  await prisma.module.update({ where: { id: 'linux-fund-2' }, data: { title: 'Linux Fundamentals 2' } });
  console.log('✓ Module linux-fund-2 → "Linux Fundamentals 2"');

  await prisma.parcours.update({
    where: { id: 'comp10' },
    data: { prerequisiteId: 'nexus-guide' },
  });
  console.log('✓ Parcours comp10 → prerequisite: how-to-use-nexus');

  console.log('\nTitres mis à jour avec succès.');
}

main()
  .catch(err => { console.error('Erreur :', err.message); process.exit(1); })
  .finally(() => process.exit(0));
