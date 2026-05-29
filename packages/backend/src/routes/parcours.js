const express = require('express');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/', async (req, res) => {
  let userId = null;
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId = payload.userId ?? payload.id ?? null;
    } catch {}
  }

  try {
    if (!userId) {
      const all = await prisma.parcours.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true, language: true, order: true, prerequisiteId: true, _count: { select: { tracks: true } } },
      });
      return res.json(all.map(p => ({ ...p, prerequisiteCompleted: true })));
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

    if (currentUser?.role === 'TEACHER' || currentUser?.role === 'ADMIN') {
      const all = await prisma.parcours.findMany({
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true, language: true, order: true, prerequisiteId: true, _count: { select: { tracks: true } } },
      });
      return res.json(all.map(p => ({ ...p, prerequisiteCompleted: true })));
    }

    // Students: only enrolled parcours
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      select: { parcoursId: true },
    });
    const enrolledIds = new Set(enrollments.map(e => e.parcoursId));

    const parcoursList = await prisma.parcours.findMany({
      where: { id: { in: [...enrolledIds] } },
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        order: true,
        prerequisiteId: true,
        _count: { select: { tracks: true } },
      },
    });

    const prereqIds = [...new Set(parcoursList.map(p => p.prerequisiteId).filter(Boolean))];
    const prereqCompletionMap = {};

    for (const prereqId of prereqIds) {
      const prereq = await prisma.parcours.findUnique({
        where: { id: prereqId },
        select: {
          tracks: {
            select: {
              track: {
                select: {
                  modules: {
                    select: {
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
                  },
                },
              },
            },
          },
        },
      });

      let total = 0, done = 0;
      prereq?.tracks.forEach(pt => {
        pt.track.modules.forEach(mod => {
          total += mod._count.tasks;
          done  += mod.tasks.filter(t => t.progress.length > 0).length;
        });
      });
      prereqCompletionMap[prereqId] = total > 0 && done === total;
    }

    const result = parcoursList.map(p => ({
      ...p,
      prerequisiteCompleted: p.prerequisiteId
        ? (prereqCompletionMap[p.prerequisiteId] ?? false)
        : true,
    }));

    res.json(result);
  } catch (err) {
    console.error('[GET /api/parcours]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  let userId = null;
  const token = req.cookies?.token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      userId = payload.userId ?? payload.id ?? null;
    } catch {}
  }

  try {
    const parcours = await prisma.parcours.findUnique({
      where: { id: req.params.id },
      include: {
        tracks: {
          orderBy: { order: 'asc' },
          include: {
            track: {
              select: {
                id: true,
                title: true,
                description: true,
                language: true,
                icon: true,
                order: true,
                _count: { select: { modules: true } },
              },
            },
          },
        },
      },
    });

    if (!parcours) return res.status(404).json({ error: 'Parcours not found' });

    let tracks = parcours.tracks;

    if (userId) {
      const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      if (currentUser?.role === 'STUDENT') {
        const memberships = await prisma.classeMember.findMany({
          where: { userId },
          include: {
            classe: {
              include: {
                trackRestrictions: {
                  where: { parcoursId: req.params.id },
                  select: { trackId: true },
                },
              },
            },
          },
        });

        // If any class has no restriction → all tracks visible (most permissive wins)
        const anyUnrestricted = memberships.some(m => m.classe.trackRestrictions.length === 0);
        if (!anyUnrestricted && memberships.length > 0) {
          const allowedIds = new Set(
            memberships.flatMap(m => m.classe.trackRestrictions.map(tr => tr.trackId))
          );
          tracks = tracks.filter(pt => allowedIds.has(pt.trackId));
        }
      }
    }

    res.json({
      id: parcours.id,
      title: parcours.title,
      description: parcours.description,
      language: parcours.language,
      order: parcours.order,
      tracks: tracks.map(pt => ({ ...pt.track, orderInParcours: pt.order })),
    });
  } catch (err) {
    console.error('[GET /api/parcours/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
