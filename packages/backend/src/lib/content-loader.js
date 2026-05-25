const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const prisma = require('./prisma');

const CONTENT_DIR = '/content/parcours';

async function loadContent() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn('[content-loader] Content directory not found:', CONTENT_DIR);
    return;
  }

  console.log('[content-loader] Scanning', CONTENT_DIR);
  let totalModules = 0;
  let totalTasks = 0;

  const parcoursDirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const parcoursId of parcoursDirs) {
    await prisma.parcours.upsert({
      where: { id: parcoursId },
      create: { id: parcoursId, title: parcoursId },
      update: {},
    });

    const tracksDir = path.join(CONTENT_DIR, parcoursId, 'tracks');
    if (!fs.existsSync(tracksDir)) continue;

    const trackDirs = fs.readdirSync(tracksDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const trackId of trackDirs) {
      await prisma.track.upsert({
        where: { id: trackId },
        create: { id: trackId, title: trackId },
        update: {},
      });

      await prisma.parcoursTracks.upsert({
        where: { parcoursId_trackId: { parcoursId, trackId } },
        create: { parcoursId, trackId },
        update: {},
      });

      const modulesDir = path.join(tracksDir, trackId, 'modules');
      if (!fs.existsSync(modulesDir)) continue;

      const yamlFiles = fs.readdirSync(modulesDir)
        .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));

      for (const yamlFile of yamlFiles) {
        const filePath = path.join(modulesDir, yamlFile);
        try {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const data = yaml.load(raw);
          const mod = data.module;

          await prisma.module.upsert({
            where: { id: mod.id },
            create: {
              id: mod.id,
              trackId: mod.trackId,
              title: mod.title,
              description: mod.description ?? null,
              order: mod.order,
              xpReward: mod.xpReward ?? 50,
              mascot: mod.mascot ?? null,
            },
            update: {
              title: mod.title,
              description: mod.description ?? null,
              order: mod.order,
              xpReward: mod.xpReward ?? 50,
              mascot: mod.mascot ?? null,
            },
          });
          totalModules++;

          for (const task of (mod.tasks ?? [])) {
            await prisma.task.upsert({
              where: { id: task.id },
              create: {
                id: task.id,
                moduleId: mod.id,
                type: task.type.toUpperCase(),
                title: task.title,
                order: task.order,
                xpReward: task.xpReward ?? 15,
                content: task.sections ?? null,
              },
              update: {
                type: task.type.toUpperCase(),
                title: task.title,
                order: task.order,
                xpReward: task.xpReward ?? 15,
                content: task.sections ?? null,
              },
            });
            totalTasks++;
          }
        } catch (err) {
          console.error(`[content-loader] Error parsing ${filePath}:`, err.message);
        }
      }
    }
  }

  console.log(`[content-loader] Done — ${totalModules} modules, ${totalTasks} tasks imported`);
}

module.exports = { loadContent };
