const prisma = require('./src/lib/prisma');

async function main() {
  const rewards = [
    { id: 'avatar-reward-cyber-1', moduleId: 'cyber-security-101-1-fr', avatarId: 'slyx-classique',        title: 'Slyx Classique',        description: 'Débloqué en complétant le module 1 de Cyber Security 101.' },
    { id: 'avatar-reward-cyber-2', moduleId: 'cyber-security-101-2-fr', avatarId: 'slyx-apprenti',         title: 'Slyx Apprenti',         description: 'Débloqué en complétant le module 2 de Cyber Security 101.' },
    { id: 'avatar-reward-cyber-3', moduleId: 'cyber-security-101-3-fr', avatarId: 'slyx-observateur',      title: 'Slyx Observateur',      description: 'Débloqué en complétant le module 3 de Cyber Security 101.' },
    { id: 'avatar-reward-cyber-4', moduleId: 'cyber-security-101-4-fr', avatarId: 'slyx-analyste-junior',  title: 'Slyx Analyste Junior',  description: 'Débloqué en complétant le module 4 de Cyber Security 101.' },
    { id: 'avatar-reward-cyber-5', moduleId: 'cyber-security-101-5-fr', avatarId: 'slyx-tech-lab',         title: 'Slyx Technicien de Lab', description: 'Débloqué en complétant le module 5 de Cyber Security 101.' },
    { id: 'avatar-reward-cyber-6', moduleId: 'cyber-security-101-6-fr', avatarId: 'slyx-renonnaissance',   title: 'Slyx Reconnaissance',   description: 'Débloqué en complétant le module 6 de Cyber Security 101.' },
  ];

  for (const { id, moduleId, avatarId, title, description } of rewards) {
    const result = await prisma.avatarReward.upsert({
      where: { id },
      update: { avatarId, title, description },
      create: { id, triggerType: 'module', triggerId: moduleId, avatarId, title, description },
    });
    console.log(`[avatar] ${moduleId} → ${avatarId} (id: ${result.id})`);
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => process.exit());
