const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

router.get('/topic/:topicId', async (req, res) => {
  const games = await prisma.gameLink.findMany({
    where: { topicId: req.params.topicId },
    orderBy: { order: 'asc' },
  });
  res.json(games);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { topicId, title, url, description, platform, order } = req.body;
  if (!isSafeUrl(url)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const game = await prisma.gameLink.create({
      data: { topicId, title, url, description, platform, order: order || 0 },
    });
    res.status(201).json(game);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { title, url, description, platform, order } = req.body;
  if (!isSafeUrl(url)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const game = await prisma.gameLink.update({
      where: { id: req.params.id },
      data: { title, url, description, platform, order },
    });
    res.json(game);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.gameLink.delete({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
});

// Student video/darsni ochganini qayd etamiz — ball berilmaydi,
// ball faqat test natijasi uchun beriladi
router.post('/:id/open', authenticate, async (req, res) => {
  const userId = req.user.userId;
  if (!userId) return res.json({ message: 'ok' });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const already = await prisma.userActivity.findFirst({
    where: { userId, action: 'GAME_OPEN', meta: { path: ['gameId'], equals: req.params.id }, createdAt: { gte: today } },
  });
  if (!already) {
    await prisma.userActivity.create({ data: { userId, action: 'GAME_OPEN', points: 0, meta: { gameId: req.params.id } } });
  }
  res.json({ message: 'ok' });
});

module.exports = router;
