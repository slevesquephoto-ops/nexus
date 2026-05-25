const bcrypt = require('bcryptjs');
const prisma = require('./src/lib/prisma');

async function main() {
  const SALT_ROUNDS = 10;

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: await bcrypt.hash('admin123', SALT_ROUNDS),
      role: 'ADMIN',
    },
  });
  console.log(`[seed] Admin: ${admin.username} (${admin.id})`);

  const student = await prisma.user.upsert({
    where: { username: 'etudiant' },
    update: {},
    create: {
      username: 'etudiant',
      passwordHash: await bcrypt.hash('test123', SALT_ROUNDS),
      role: 'STUDENT',
    },
  });
  console.log(`[seed] Student: ${student.username} (${student.id})`);

  await prisma.badge.upsert({
    where: { id: 'premier-pas' },
    create: {
      id: 'premier-pas',
      title: 'Premier Pas',
      description: 'Complète ta première task.',
      imageUrl: '🐾',
      condition: 'first_task',
    },
    update: {},
  });
  console.log('[seed] Badge "Premier Pas" OK');
}

main()
  .catch(err => { console.error('[seed]', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
