const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth, requireTeacher } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', requireAuth, requireTeacher, async (req, res) => {
  try {
    const classes = await prisma.classe.findMany({
      where: { teacherId: req.user.id },
      include: { members: { select: { userId: true } } },
    });

    const studentIds = [...new Set(classes.flatMap(c => c.members.map(m => m.userId)))];

    const recentActivity = studentIds.length > 0
      ? await prisma.xpLog.findMany({
          where: { userId: { in: studentIds } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { username: true } } },
        })
      : [];

    res.json({
      classCount: classes.length,
      studentCount: studentIds.length,
      recentActivity: recentActivity.map(l => ({
        id: l.id,
        username: l.user.username,
        amount: l.amount,
        reason: l.reason,
        createdAt: l.createdAt,
      })),
    });
  } catch (err) {
    console.error('[GET /api/admin/dashboard]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/classes', requireAuth, requireTeacher, async (req, res) => {
  try {
    const classes = await prisma.classe.findMany({
      where: { teacherId: req.user.id },
      include: {
        parcours: { select: { id: true, title: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(classes.map(c => ({
      id: c.id,
      name: c.name,
      inviteCode: c.inviteCode,
      parcours: c.parcours,
      memberCount: c._count.members,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    console.error('[GET /api/admin/classes]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/classes', requireAuth, requireTeacher, async (req, res) => {
  const { name, parcoursId } = req.body;
  if (!name || !parcoursId) {
    return res.status(400).json({ error: 'name and parcoursId are required' });
  }

  try {
    const parcours = await prisma.parcours.findUnique({ where: { id: parcoursId } });
    if (!parcours) return res.status(404).json({ error: 'Parcours not found' });

    const classe = await prisma.classe.create({
      data: { name, parcoursId, teacherId: req.user.id },
      include: {
        parcours: { select: { id: true, title: true } },
        _count: { select: { members: true } },
      },
    });

    res.status(201).json({
      id: classe.id,
      name: classe.name,
      inviteCode: classe.inviteCode,
      parcours: classe.parcours,
      memberCount: 0,
      createdAt: classe.createdAt,
    });
  } catch (err) {
    console.error('[POST /api/admin/classes]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/classes/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const classe = await prisma.classe.findUnique({
      where: { id: req.params.id },
      include: {
        parcours: {
          include: {
            tracks: {
              include: {
                track: {
                  include: {
                    modules: {
                      include: { tasks: { select: { id: true } } },
                      orderBy: { order: 'asc' },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        members: {
          include: {
            user: { select: { id: true, username: true, xp: true, taskProgress: { where: { completed: true }, select: { taskId: true } } } },
          },
        },
      },
    });

    if (!classe) return res.status(404).json({ error: 'Class not found' });
    if (classe.teacherId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const modules = classe.parcours.tracks
      .flatMap(pt => pt.track.modules)
      .map(m => ({ id: m.id, title: m.title, taskCount: m.tasks.length, taskIds: m.tasks.map(t => t.id) }));

    const students = classe.members.map(member => {
      const completedSet = new Set(member.user.taskProgress.map(p => p.taskId));
      const progress = modules.map(mod => {
        const completedTasks = mod.taskIds.filter(id => completedSet.has(id)).length;
        const totalTasks = mod.taskCount;
        const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        return { moduleId: mod.id, completedTasks, totalTasks, pct };
      });
      return { id: member.user.id, username: member.user.username, xp: member.user.xp, progress };
    });

    res.json({
      classe: { id: classe.id, name: classe.name, inviteCode: classe.inviteCode, parcours: { id: classe.parcours.id, title: classe.parcours.title } },
      modules: modules.map(m => ({ id: m.id, title: m.title, taskCount: m.taskCount })),
      students,
    });
  } catch (err) {
    console.error('[GET /api/admin/classes/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/classes/:id/join', requireAuth, async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'inviteCode is required' });

  try {
    const classe = await prisma.classe.findFirst({
      where: { id: req.params.id, inviteCode },
    });
    if (!classe) return res.status(404).json({ error: 'Invalid invite code or class not found' });

    await prisma.classeMember.upsert({
      where: { userId_classeId: { userId: req.user.id, classeId: classe.id } },
      create: { userId: req.user.id, classeId: classe.id },
      update: {},
    });

    await prisma.enrollment.upsert({
      where: { userId_parcoursId: { userId: req.user.id, parcoursId: classe.parcoursId } },
      create: { userId: req.user.id, parcoursId: classe.parcoursId },
      update: {},
    });

    res.json({ ok: true, parcoursId: classe.parcoursId });
  } catch (err) {
    console.error('[POST /api/admin/classes/:id/join]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
