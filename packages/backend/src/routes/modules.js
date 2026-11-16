const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const mod = await prisma.module.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        xpReward: true,
        track: { select: { id: true, title: true } },
        tasks: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            xpReward: true,
          },
        },
      },
    });

    if (!mod) return res.status(404).json({ error: 'Module not found' });
    res.json(mod);
  } catch (err) {
    console.error('[GET /api/modules/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/progress', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'userId query parameter required' });

  try {
    const mod = await prisma.module.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        tasks: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            xpReward: true,
            progress: {
              where: { userId },
              select: { completed: true, completedAt: true, score: true },
            },
          },
        },
      },
    });

    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const tasks = mod.tasks.map(({ progress, ...task }) => ({
      ...task,
      completed: progress[0]?.completed ?? false,
      completedAt: progress[0]?.completedAt ?? null,
      score: progress[0]?.score ?? null,
    }));

    res.json({ moduleId: req.params.id, title: mod.title, tasks });
  } catch (err) {
    console.error('[GET /api/modules/:id/progress]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/full', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const mod = await prisma.module.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        xpReward: true,
        track: { select: { id: true, title: true } },
        tasks: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            order: true,
            xpReward: true,
            content: true,
            progress: {
              where: { userId },
              select: { completed: true, score: true, submittedAt: true },
            },
          },
        },
      },
    });
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const tasks = mod.tasks.map(({ progress, ...task }) => ({
      ...task,
      completed: progress[0]?.completed ?? false,
      score: progress[0]?.score ?? null,
      submittedAt: progress[0]?.submittedAt ?? null,
    }));

    res.json({ ...mod, tasks });
  } catch (err) {
    console.error('[GET /api/modules/:id/full]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
