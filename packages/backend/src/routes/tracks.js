const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/:id', async (req, res) => {
  const { userId } = req.query;

  try {
    const track = await prisma.track.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        icon: true,
        order: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            xpReward: true,
            _count: { select: { tasks: true } },
            tasks: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                ...(userId ? {
                  progress: {
                    where: { userId: String(userId), completed: true },
                    select: { id: true },
                  },
                } : {}),
              },
            },
          },
        },
      },
    });

    if (!track) return res.status(404).json({ error: 'Track not found' });

    // Sans userId : comportement précédent (firstTaskId seulement)
    if (!userId) {
      const modules = track.modules.map(mod => ({
        ...mod,
        tasks: mod.tasks.slice(0, 1),
      }));
      return res.json({ ...track, modules });
    }

    // Avec userId : statuts calculés côté backend
    let prevDone = true;
    const modules = track.modules.map(mod => {
      const total = mod._count.tasks;
      const completed = mod.tasks.filter(t => t.progress && t.progress.length > 0).length;
      const allDone = total > 0 && completed === total;

      let status;
      if (allDone)       status = 'done';
      else if (prevDone) status = 'active';
      else               status = 'locked';

      prevDone = allDone;

      const firstUncompleted = mod.tasks.find(t => !t.progress || t.progress.length === 0);
      const firstTaskId = firstUncompleted?.id ?? mod.tasks[0]?.id ?? null;

      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        xpReward: mod.xpReward,
        _count: mod._count,
        tasks: firstTaskId ? [{ id: firstTaskId }] : [],
        status,
        completedTaskCount: completed,
      };
    });

    res.json({ ...track, modules });
  } catch (err) {
    console.error('[GET /api/tracks/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
