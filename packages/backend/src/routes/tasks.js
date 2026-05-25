const express = require('express');
const prisma = require('../lib/prisma');
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

module.exports = router;
