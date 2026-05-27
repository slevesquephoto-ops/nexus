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

  const teacher = await prisma.user.upsert({
    where: { username: 'prof' },
    update: {},
    create: {
      username: 'prof',
      passwordHash: await bcrypt.hash('prof123', SALT_ROUNDS),
      role: 'TEACHER',
    },
  });
  console.log(`[seed] Teacher: ${teacher.username} (${teacher.id})`);

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

  const avatarRewards = [
    { id: 'reward-nexus-guide',  avatarId: 'nexus-agent', triggerType: 'module', triggerId: 'nexus-onboarding',
      title: 'Agent NEXUS',   description: 'Awarded for completing How to use NEXUS' },
    { id: 'reward-linux-fund-1', avatarId: 'default',     triggerType: 'module', triggerId: 'linux-fund-1',
      title: 'Tux Classic',   description: 'Awarded for completing Linux Fundamentals 1' },
    { id: 'reward-linux-fund-2', avatarId: 'debutant',    triggerType: 'module', triggerId: 'linux-fund-2',
      title: 'Tux Casquette', description: 'Awarded for completing Linux Fundamentals 2' },
    { id: 'reward-linux-fund-3', avatarId: 'stagiaire',   triggerType: 'module', triggerId: 'linux-fund-3',
      title: 'Stagiaire IT',  description: 'Awarded for completing Linux Fundamentals 3' },
    { id: 'reward-linux-track',  avatarId: 'technicien',  triggerType: 'track',  triggerId: 'linux',
      title: 'Technicien',    description: 'Awarded for completing the full Linux track' },
  ];
  for (const { id, ...data } of avatarRewards) {
    await prisma.avatarReward.upsert({ where: { id }, create: { id, ...data }, update: data });
  }
  console.log('[seed] AvatarRewards OK');

  // Fix existing users with no avatarId
  const fixed = await prisma.user.updateMany({
    where: { avatarId: null },
    data: { avatarId: 'noob' },
  });
  if (fixed.count > 0) console.log(`[seed] Fixed ${fixed.count} user(s) with null avatarId → noob`);
}

main()
  .catch(err => { console.error('[seed]', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
