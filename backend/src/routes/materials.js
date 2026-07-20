const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

router.get('/topic/:topicId', async (req, res) => {
  const materials = await prisma.material.findMany({
    where: { topicId: req.params.topicId },
    orderBy: { order: 'asc' },
  });
  res.json(materials);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { topicId, type, title, content, url, order } = req.body;
  if (!isSafeUrl(url)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  try {
    const material = await prisma.material.create({
      data: { topicId, type, title, content, url, order: order || 0 },
    });
    res.status(201).json(material);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { title, content, url, order, type } = req.body;
  if (!isSafeUrl(url)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  try {
    const material = await prisma.material.update({
      where: { id: req.params.id },
      data: { title, content, url, order, type },
    });
    res.json(material);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.material.delete({ where: { id: req.params.id } });
  res.json({ message: 'Óshirildi' });
});

module.exports = router;
