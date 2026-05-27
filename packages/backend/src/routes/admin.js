const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { requireAuth, requireTeacher } = require('../middleware/auth');
const { calculateLevel } = require('../lib/levels');

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

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const pick = (s) => s[Math.floor(Math.random() * s.length)];
  return `${pick(chars)}${pick(chars)}${pick(chars)}-${pick(digits)}${pick(digits)}${pick(digits)}`;
}

router.post('/classes', requireAuth, requireTeacher, async (req, res) => {
  const { name, parcoursId } = req.body;
  if (!name || !parcoursId) {
    return res.status(400).json({ error: 'name and parcoursId are required' });
  }

  try {
    const parcours = await prisma.parcours.findUnique({ where: { id: parcoursId } });
    if (!parcours) return res.status(404).json({ error: 'Parcours not found' });

    const inviteCode = generateInviteCode();

    const classe = await prisma.classe.create({
      data: { name, parcoursId, teacherId: req.user.id, inviteCode },
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

router.post('/users', requireAuth, requireTeacher, async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }
  if (role && !['STUDENT', 'TEACHER'].includes(role)) {
    return res.status(400).json({ error: 'role must be STUDENT or TEACHER' });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(409).json({ error: 'Username already taken' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, role: role ?? 'STUDENT', createdBy: req.user.id, avatarId: 'default' },
      select: { id: true, username: true, role: true },
    });
    res.status(201).json(user);
  } catch (err) {
    console.error('[POST /api/admin/users]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/users', requireAuth, requireTeacher, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { createdBy: req.user.id },
      select: { id: true, username: true, role: true, xp: true, level: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    console.error('[GET /api/admin/users]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.createdBy !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.$transaction([
      prisma.classeMember.deleteMany({ where: { userId: user.id } }),
      prisma.enrollment.deleteMany({ where: { userId: user.id } }),
      prisma.taskProgress.deleteMany({ where: { userId: user.id } }),
      prisma.userBadge.deleteMany({ where: { userId: user.id } }),
      prisma.xpLog.deleteMany({ where: { userId: user.id } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/users/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/classes/:id/students', requireAuth, requireTeacher, async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'username is required' });

  try {
    const classe = await prisma.classe.findUnique({ where: { id: req.params.id } });
    if (!classe) return res.status(404).json({ error: 'Class not found' });
    if (classe.teacherId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await prisma.classeMember.upsert({
      where: { userId_classeId: { userId: user.id, classeId: classe.id } },
      create: { userId: user.id, classeId: classe.id },
      update: {},
    });
    await prisma.enrollment.upsert({
      where: { userId_parcoursId: { userId: user.id, parcoursId: classe.parcoursId } },
      create: { userId: user.id, parcoursId: classe.parcoursId },
      update: {},
    });

    res.json({ id: user.id, username: user.username });
  } catch (err) {
    console.error('[POST /api/admin/classes/:id/students]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/classes/:id/students/:userId', requireAuth, requireTeacher, async (req, res) => {
  try {
    const classe = await prisma.classe.findUnique({ where: { id: req.params.id } });
    if (!classe) return res.status(404).json({ error: 'Class not found' });
    if (classe.teacherId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.classeMember.delete({
      where: { userId_classeId: { userId: req.params.userId, classeId: classe.id } },
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/classes/:id/students/:userId]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/classes/:id', requireAuth, requireTeacher, async (req, res) => {
  try {
    const classe = await prisma.classe.findUnique({ where: { id: req.params.id } });
    if (!classe) return res.status(404).json({ error: 'Class not found' });
    if (classe.teacherId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    await prisma.$transaction([
      prisma.classeMember.deleteMany({ where: { classeId: classe.id } }),
      prisma.classe.delete({ where: { id: classe.id } }),
    ]);
    res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /api/admin/classes/:id]', err);
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

router.post('/users/:userId/xp', requireAuth, requireTeacher, async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: 'reason is required' });
  }

  try {
    const membership = await prisma.classeMember.findFirst({
      where: { userId: req.params.userId, classe: { teacherId: req.user.id } },
    });
    if (!membership) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        xp: { increment: amount },
        xpLogs: { create: { amount, reason: reason.trim() } },
      },
      select: { xp: true, level: true },
    });

    const newLevel = calculateLevel(updated.xp);
    if (newLevel !== updated.level) {
      await prisma.user.update({ where: { id: req.params.userId }, data: { level: newLevel } });
    }

    res.json({ newXp: updated.xp, newLevel, log: { amount, reason: reason.trim() } });
  } catch (err) {
    console.error('[POST /api/admin/users/:userId/xp]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/classes/:id/challenges', requireAuth, requireTeacher, async (req, res) => {
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
                      include: {
                        tasks: {
                          where: { type: 'CHALLENGE' },
                          select: { id: true, title: true, xpReward: true },
                        },
                      },
                      orderBy: { order: 'asc' },
                    },
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    if (!classe) return res.status(404).json({ error: 'Class not found' });
    if (classe.teacherId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

    const students = classe.members.map(m => m.user);
    const challenges = classe.parcours.tracks
      .flatMap(pt => pt.track.modules)
      .flatMap(mod => mod.tasks.map(t => ({ ...t, moduleTitle: mod.title })));

    if (challenges.length === 0) return res.json({ challenges: [] });

    const progressRecords = await prisma.taskProgress.findMany({
      where: {
        taskId: { in: challenges.map(c => c.id) },
        userId: { in: students.map(s => s.id) },
      },
    });

    const progressMap = {};
    for (const p of progressRecords) {
      progressMap[`${p.userId}:${p.taskId}`] = p;
    }

    const result = challenges.map(challenge => ({
      id: challenge.id,
      title: challenge.title,
      moduleTitle: challenge.moduleTitle,
      xpReward: challenge.xpReward,
      students: students.map(student => {
        const prog = progressMap[`${student.id}:${challenge.id}`];
        let status = 'not_started';
        if (prog?.completed) status = 'passed';
        else if (prog && prog.score !== null) status = 'failed';
        return { userId: student.id, username: student.username, status, score: prog?.score ?? null };
      }),
    }));

    res.json({ challenges: result });
  } catch (err) {
    console.error('[GET /api/admin/classes/:id/challenges]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/tasks/:taskId/grade', requireAuth, requireTeacher, async (req, res) => {
  const { userId, score, passed } = req.body;
  if (!userId || score === undefined || passed === undefined) {
    return res.status(400).json({ error: 'userId, score and passed are required' });
  }

  try {
    // Verify student is in a class owned by this teacher
    const studentMembership = await prisma.classeMember.findFirst({
      where: { userId, classe: { teacherId: req.user.id } },
    });
    if (!studentMembership) return res.status(403).json({ error: 'Forbidden: student not in your class' });

    // Verify the task's track belongs to a parcours of one of this teacher's classes
    const task = await prisma.task.findUnique({
      where: { id: req.params.taskId },
      include: { module: { include: { track: { include: { parcours: true } } } } },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const trackParcoursIds = task.module.track.parcours.map(pt => pt.parcoursId);
    const classOwnership = await prisma.classe.findFirst({
      where: { teacherId: req.user.id, parcoursId: { in: trackParcoursIds } },
    });
    if (!classOwnership) return res.status(403).json({ error: 'Forbidden: task not in your parcours' });

    const existing = await prisma.taskProgress.findUnique({
      where: { userId_taskId: { userId, taskId: req.params.taskId } },
    });

    let xpAwarded = 0;

    if (passed) {
      await prisma.taskProgress.upsert({
        where: { userId_taskId: { userId, taskId: req.params.taskId } },
        create: { userId, taskId: req.params.taskId, completed: true, score, completedAt: new Date() },
        update: { completed: true, score, completedAt: new Date() },
      });

      if (!existing?.completed) {
        xpAwarded = task.xpReward;
        const updated = await prisma.user.update({
          where: { id: userId },
          data: {
            xp: { increment: xpAwarded },
            xpLogs: { create: { amount: xpAwarded, reason: `Graded: ${task.title}` } },
          },
          select: { xp: true, level: true },
        });
        const newLevel = calculateLevel(updated.xp);
        if (newLevel !== updated.level) {
          await prisma.user.update({ where: { id: userId }, data: { level: newLevel } });
        }
      }
    } else {
      await prisma.taskProgress.upsert({
        where: { userId_taskId: { userId, taskId: req.params.taskId } },
        create: { userId, taskId: req.params.taskId, completed: false, score },
        update: { completed: false, score },
      });
    }

    res.json({
      progress: { completed: passed, score },
      xpAwarded,
    });
  } catch (err) {
    console.error('[PATCH /api/admin/tasks/:taskId/grade]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
