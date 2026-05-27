const express = require('express');
const { requireAuth } = require('../middleware/auth');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

router.get('/me/xplogs', requireAuth, async (req, res) => {
  try {
    const logs = await prisma.xpLog.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, amount: true, reason: true, createdAt: true },
    });
    res.json(logs);
  } catch (err) {
    console.error('[GET /api/users/me/xplogs]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/stats', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const tasksCompleted = await prisma.taskProgress.count({
      where: { userId, completed: true },
    });

    const allModules = await prisma.module.findMany({
      select: {
        id: true,
        trackId: true,
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            progress: {
              where: { userId, completed: true },
              select: { id: true },
            },
          },
        },
      },
    });

    const completedModuleIds = new Set(
      allModules
        .filter(m => m._count.tasks > 0 && m.tasks.every(t => t.progress.length > 0))
        .map(m => m.id)
    );

    const allTracks = await prisma.track.findMany({
      select: {
        id: true,
        _count: { select: { modules: true } },
        modules: { select: { id: true } },
      },
    });

    const tracksCompleted = allTracks.filter(t =>
      t._count.modules > 0 && t.modules.every(m => completedModuleIds.has(m.id))
    ).length;

    res.json({
      tasksCompleted,
      modulesCompleted: completedModuleIds.size,
      tracksCompleted,
      xp: req.user.xp,
    });
  } catch (err) {
    console.error('[GET /api/users/me/stats]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/badges', requireAuth, async (req, res) => {
  try {
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: req.user.id },
      orderBy: { earnedAt: 'desc' },
      include: { badge: true },
    });
    res.json(userBadges.map(ub => ({
      id: ub.badgeId,
      title: ub.badge.title,
      description: ub.badge.description,
      imageUrl: ub.badge.imageUrl,
      earnedAt: ub.earnedAt,
    })));
  } catch (err) {
    console.error('[GET /api/users/me/badges]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/current-position', requireAuth, async (req, res) => {
  try {
    const completions = await prisma.taskProgress.findMany({
      where: { userId: req.user.id, completed: true },
      select: { taskId: true },
    });
    const doneIds = new Set(completions.map(c => c.taskId));

    const allParcours = await prisma.parcours.findMany({
      orderBy: { order: 'asc' },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
          include: {
            track: {
              include: {
                modules: {
                  orderBy: { order: 'asc' },
                  include: { tasks: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    for (const parcours of allParcours) {
      for (const pt of parcours.tracks) {
        const track = pt.track;
        for (const module of track.modules) {
          if (module.tasks.length > 0 && !module.tasks.every(t => doneIds.has(t.id))) {
            return res.json({ parcoursId: parcours.id, trackId: track.id, moduleId: module.id });
          }
        }
      }
    }
    res.json(null);
  } catch (err) {
    console.error('[GET /api/users/me/current-position]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me/avatars', requireAuth, async (req, res) => {
  const { AVATARS } = require('../lib/avatars');
  const userId = req.user.id;
  try {
    const earned = await prisma.userAvatarReward.findMany({
      where: { userId },
      include: { reward: true },
    });
    const unlockedIds = new Set(['noob', ...earned.map(e => e.reward.avatarId)]);
    const avatars = AVATARS
      .filter(a => unlockedIds.has(a.id))
      .map(a => ({ ...a, isActive: req.user.avatarId === a.id }));
    res.json({ avatars });
  } catch (err) {
    console.error('[GET /api/users/me/avatars]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/me/avatar', requireAuth, async (req, res) => {
  const { avatarId } = req.body;
  const { AVATARS } = require('../lib/avatars');
  const avatar = AVATARS.find(a => a.id === avatarId);
  if (!avatar) return res.status(400).json({ error: 'Avatar inconnu' });
  if (req.user.xp < avatar.xpRequired) return res.status(403).json({ error: 'XP insuffisant' });
  try {
    const updated = await prisma.user.update({ where: { id: req.user.id }, data: { avatarId } });
    res.json({ avatarId: updated.avatarId });
  } catch (err) {
    console.error('[POST /api/users/me/avatar]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
