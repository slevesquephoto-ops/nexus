const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { calculateLevel } = require('../lib/levels');
const router = express.Router();

async function checkAvatarRewards(userId, completedTaskId) {
  const task = await prisma.task.findUnique({
    where: { id: completedTaskId },
    include: { module: { include: { tasks: true, track: true } } },
  });

  const moduleTaskIds = task.module.tasks.map(t => t.id);
  const completedCount = await prisma.taskProgress.count({
    where: { userId, taskId: { in: moduleTaskIds }, completed: true },
  });
  const moduleComplete = completedCount === moduleTaskIds.length;

  let newAvatar = null;

  if (moduleComplete) {
    const moduleReward = await prisma.avatarReward.findFirst({
      where: { triggerType: 'module', triggerId: task.moduleId },
    });
    if (moduleReward) {
      const alreadyHas = await prisma.userAvatarReward.findFirst({
        where: { userId, avatarRewardId: moduleReward.id },
      });
      if (!alreadyHas) {
        await prisma.userAvatarReward.create({
          data: { userId, avatarRewardId: moduleReward.id },
        });
        newAvatar = moduleReward;
      }
    }

    // Vérifier si le track entier est complété
    const trackModules = await prisma.module.findMany({
      where: { trackId: task.module.trackId },
      include: { tasks: true },
    });
    const allTrackTaskIds = trackModules.flatMap(m => m.tasks.map(t => t.id));
    const completedTrackCount = await prisma.taskProgress.count({
      where: { userId, taskId: { in: allTrackTaskIds }, completed: true },
    });
    if (completedTrackCount === allTrackTaskIds.length) {
      const trackReward = await prisma.avatarReward.findFirst({
        where: { triggerType: 'track', triggerId: task.module.trackId },
      });
      if (trackReward) {
        const alreadyHasTrack = await prisma.userAvatarReward.findFirst({
          where: { userId, avatarRewardId: trackReward.id },
        });
        if (!alreadyHasTrack) {
          await prisma.userAvatarReward.create({
            data: { userId, avatarRewardId: trackReward.id },
          });
          if (!newAvatar) newAvatar = trackReward;
        }
      }
    }
  }

  return newAvatar;
}

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

      // Badge "Premier Pas" : première task complétée
      try {
        const totalDone = await prisma.taskProgress.count({
          where: { userId, completed: true },
        });
        if (totalDone === 1) {
          await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: 'premier-pas' } },
            create: { userId, badgeId: 'premier-pas' },
            update: {},
          });
        }
      } catch (badgeErr) {
        console.warn('[complete] Badge attribution skipped:', badgeErr.message);
      }
    }

    // Vérification des récompenses avatar
    let newAvatarData = null;
    if (isNew) {
      try {
        const newAvatar = await checkAvatarRewards(userId, taskId);
        if (newAvatar) {
          const { AVATARS } = require('../lib/avatars');
          const avatarFile = AVATARS.find(a => a.id === newAvatar.avatarId)?.file ?? null;
          newAvatarData = {
            avatarId: newAvatar.avatarId,
            title: newAvatar.title,
            description: newAvatar.description,
            file: avatarFile,
          };
        }
      } catch (avatarErr) {
        console.warn('[complete] Avatar reward skipped:', avatarErr.message);
      }
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    const newLevel = calculateLevel(updatedUser.xp);
    if (newLevel !== updatedUser.level) {
      await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
      updatedUser.level = newLevel;
    }

    const tasks = task.module.tasks;
    const idx = tasks.findIndex(t => t.id === taskId);
    const nextTaskId = tasks[idx + 1]?.id ?? null;

    res.json({
      xpGained,
      user: { xp: updatedUser.xp, level: updatedUser.level },
      nextTaskId,
      newAvatar: newAvatarData,
    });
  } catch (err) {
    console.error('[POST /api/tasks/:id/complete]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/submit', requireAuth, async (req, res) => {
  const taskId = req.params.id;
  const userId = req.user.id;
  const { note, validations } = req.body;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, type: true },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.type !== 'CHALLENGE') return res.status(400).json({ error: 'Only challenges can be submitted' });

    const existing = await prisma.taskProgress.findUnique({
      where: { userId_taskId: { userId, taskId } },
    });
    if (existing?.completed || existing?.score !== null) {
      return res.status(409).json({ error: 'Challenge already graded' });
    }

    const response = JSON.stringify({ note: note ?? '', validations: validations ?? {} });

    await prisma.taskProgress.upsert({
      where: { userId_taskId: { userId, taskId } },
      create: { userId, taskId, completed: false, submittedAt: new Date(), response },
      update: { submittedAt: new Date(), response },
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /api/tasks/:id/submit]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
