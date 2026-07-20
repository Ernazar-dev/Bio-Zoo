const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

// Mavzuning barcha infografikalari
router.get('/topic/:topicId', async (req, res) => {
  const items = await prisma.infographic.findMany({
    where: { topicId: req.params.topicId },
    orderBy: { order: 'asc' },
  });
  res.json(items);
});

// Bitta infografika
router.get('/:id', async (req, res) => {
  const item = await prisma.infographic.findUnique({ where: { id: req.params.id } });
  if (!item) return res.status(404).json({ message: 'Tabılmadı' });
  res.json(item);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { topicId, title, imageUrl, order } = req.body;
  if (!topicId || !title || !imageUrl) return res.status(400).json({ message: 'Majburiy maydanlar toldırılmaǵan' });
  if (!isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  try {
    const item = await prisma.infographic.create({
      data: {
        topicId,
        title: String(title).slice(0, 200),
        imageUrl: String(imageUrl).slice(0, 1000),
        order: order || 0,
      },
    });
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { title, imageUrl, order } = req.body;
  if (imageUrl !== undefined && !isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  try {
    const item = await prisma.infographic.update({
      where: { id: req.params.id },
      data: {
        title: title !== undefined ? String(title).slice(0, 200) : undefined,
        imageUrl: imageUrl !== undefined ? String(imageUrl).slice(0, 1000) : undefined,
        order,
      },
    });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.infographic.delete({ where: { id: req.params.id } });
  res.json({ message: 'Óshirildi' });
});

module.exports = router;
