const express = require('express');
const prisma = require('../lib/prisma');
const router = express.Router();

router.get('/:id', async (req, res) => {
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
          },
        },
      },
    });

    if (!track) return res.status(404).json({ error: 'Track not found' });
    res.json(track);
  } catch (err) {
    console.error('[GET /api/tracks/:id]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
