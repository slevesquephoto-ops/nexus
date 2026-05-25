const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const parcours = await prisma.parcours.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        language: true,
        order: true,
        _count: { select: { tracks: true } },
      },
    });
    res.json(parcours);
  } catch (err) {
    console.error('[GET /api/parcours]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
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

    const result = {
      id: parcours.id,
      title: parcours.title,
      description: parcours.description,
      language: parcours.language,
      order: parcours.order,
      tracks: parcours.tracks.map(pt => ({
        ...pt.track,
        orderInParcours: pt.order,
      })),
    };

    res.json(result);
  } catch (err) {
    console.error('[GET /api/parcours/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
