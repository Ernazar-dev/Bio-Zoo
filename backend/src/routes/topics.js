const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

router.get('/', async (req, res) => {
  // Query param massiv bo'lib kelishi mumkin (?categoryId=a&categoryId=b) —
  // faqat string qabul qilamiz, aks holda Prisma xatoga uchraydi
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
  const topics = await prisma.topic.findMany({
    where: categoryId ? { categoryId } : {},
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { materials: true, quizzes: true, gameLinks: true } },
    },
  });
  res.json(topics);
});

router.get('/:id', async (req, res) => {
  const topic = await prisma.topic.findUnique({
    where: { id: req.params.id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      materials: { orderBy: { order: 'asc' } },
      quizzes: { select: { id: true, fileUrl: true, fileType: true, questionCount: true, timeLimit: true } },
      gameLinks: { orderBy: { order: 'asc' } },
      infographics: { orderBy: { order: 'asc' } },
      interactives: { orderBy: { order: 'asc' } },
    },
  });
  if (!topic) return res.status(404).json({ message: 'Topilmadi' });
  res.json(topic);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { categoryId, title, description, coverImage, has3DModel, order } = req.body;
  if (!isSafeUrl(coverImage)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const topic = await prisma.topic.create({
      data: { categoryId, title, description, coverImage, has3DModel: has3DModel || false, order: order || 0 },
    });
    res.status(201).json(topic);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { title, description, coverImage, has3DModel, order, categoryId } = req.body;
  if (!isSafeUrl(coverImage)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const topic = await prisma.topic.update({
      where: { id: req.params.id },
      data: { title, description, coverImage, has3DModel, order, categoryId },
    });
    res.json(topic);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.topic.delete({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
});

module.exports = router;
