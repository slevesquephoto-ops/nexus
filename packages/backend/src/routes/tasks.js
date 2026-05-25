const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        moduleId: true,
        type: true,
        title: true,
        order: true,
        xpReward: true,
        content: true,
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    console.error('[GET /api/tasks/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/complete', requireAuth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { score } = req.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        xpReward: true,
        module: {
          select: {
            tasks: { orderBy: { order: 'asc' }, select: { id: true } },
          },
        },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const existing = await prisma.taskProgress.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });
    const isNew = !existing?.completed;

    await prisma.taskProgress.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: { userId, taskId, completed: true, completedAt: new Date(), score: score ?? null },
      update: { completed: true, completedAt: new Date(), score: score ?? null },
    });

    let xpGained = 0;
    if (isNew) {
      xpGained = task.xpReward;
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpGained },
          xpLogs: { create: { amount: xpGained, reason: `Completed: ${taskId}` } },
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    const tasks = task.module.tasks;
    const idx = tasks.findIndex(t => t.id === taskId);
    const nextTaskId = tasks[idx + 1]?.id ?? null;

    res.json({
      xpGained,
      user: { xp: updatedUser.xp, level: updatedUser.level },
      nextTaskId,
    });
  } catch (err) {
    console.error('[POST /api/tasks/:id/complete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
