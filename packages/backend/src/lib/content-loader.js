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
    const parcoursMetaPath = path.join(CONTENT_DIR, parcoursId, 'meta.yaml');
    const parcoursMeta = fs.existsSync(parcoursMetaPath)
      ? yaml.load(fs.readFileSync(parcoursMetaPath, 'utf-8'))
      : {};
    const parcoursTitle = parcoursMeta.title ?? parcoursId;
    const parcoursData = {
      title: parcoursTitle,
      ...(parcoursMeta.description != null ? { description: parcoursMeta.description } : {}),
      ...(parcoursMeta.language != null ? { language: parcoursMeta.language } : {}),
      ...(parcoursMeta.order != null ? { order: parcoursMeta.order } : {}),
    };

    await prisma.parcours.upsert({
      where: { id: parcoursId },
      create: { id: parcoursId, ...parcoursData },
      update: parcoursData,
    });

    const tracksDir = path.join(CONTENT_DIR, parcoursId, 'tracks');
    if (!fs.existsSync(tracksDir)) continue;

    const trackDirs = fs.readdirSync(tracksDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const trackId of trackDirs) {
      const trackMetaPath = path.join(tracksDir, trackId, 'meta.yaml');
      const trackMeta = fs.existsSync(trackMetaPath)
        ? yaml.load(fs.readFileSync(trackMetaPath, 'utf-8'))
        : {};
      const trackTitle = trackMeta.title ?? trackId;
      const trackData = {
        title: trackTitle,
        ...(trackMeta.description != null ? { description: trackMeta.description } : {}),
        ...(trackMeta.language != null ? { language: trackMeta.language } : {}),
        ...(trackMeta.order != null ? { order: trackMeta.order } : {}),
      };

      await prisma.track.upsert({
        where: { id: trackId },
        create: { id: trackId, ...trackData },
        update: trackData,
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

          // Directory trackId is source of truth. If YAML declares a different
          // trackId (e.g. a copied module), prefix IDs to avoid conflicts.
          const trackMismatch = mod.trackId && mod.trackId !== trackId;
          const moduleId = trackMismatch ? `${trackId}-${mod.id}` : mod.id;

          await prisma.module.upsert({
            where: { id: moduleId },
            create: {
              id: moduleId,
              trackId,
              title: mod.title,
              description: mod.description ?? null,
              order: mod.order,
              xpReward: mod.xpReward ?? 50,
              mascot: mod.mascot ?? null,
            },
            update: {
              trackId,
              title: mod.title,
              description: mod.description ?? null,
              order: mod.order,
              xpReward: mod.xpReward ?? 50,
              mascot: mod.mascot ?? null,
            },
          });
          totalModules++;

          for (const task of (mod.tasks ?? [])) {
            const taskId = trackMismatch ? `${trackId}-${task.id}` : task.id;
            await prisma.task.upsert({
              where: { id: taskId },
              create: {
                id: taskId,
                moduleId,
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
