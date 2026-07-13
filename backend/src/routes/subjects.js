const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

// Kirill harflarini lotinga o'girish jadvali (slug uchun)
const CYRILLIC_MAP = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'j', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sh',
  ъ: '', ь: '', э: 'e', ю: 'yu', я: 'ya', ў: 'o', қ: 'q', ғ: 'g', ҳ: 'h',
};

// Nomdan slug yasaydi: "Zoologiya" -> "zoologiya"
const slugify = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[а-яёўқғҳ]/g, (ch) => CYRILLIC_MAP[ch] ?? ch)
    .replace(/[ʻʼ'’`]/g, '') // o'zbekcha apostroflar: o', g'
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'fan';

// Slug band bo'lsa oxiriga -2, -3 ... qo'shib takrorlanmasini topadi
const uniqueSlug = async (name) => {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await prisma.subject.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
};

// Barcha fanlar (kategoriyalar soni bilan)
router.get('/', async (req, res) => {
  const subjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: { _count: { select: { categories: true } } },
  });
  res.json(subjects);
});

// Bitta fan slug bo'yicha — ichidagi kategoriyalari bilan
router.get('/:slug', async (req, res) => {
  const subject = await prisma.subject.findUnique({
    where: { slug: req.params.slug },
    include: {
      categories: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { topics: true } } },
      },
    },
  });
  if (!subject) return res.status(404).json({ message: 'Topilmadi' });
  res.json(subject);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, description, imageUrl, order } = req.body;
  if (!isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const slug = req.body.slug || (await uniqueSlug(name));
    const subject = await prisma.subject.create({ data: { name, slug, description, imageUrl, order: order || 0 } });
    res.status(201).json(subject);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { name, slug, description, imageUrl, order } = req.body;
  if (!isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL faqat http(s) bo\'lishi mumkin' });
  try {
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data: { name, slug, description, imageUrl, order },
    });
    res.json(subject);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar noto\'g\'ri' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  // Fan o'chirilsa, kategoriyalar o'chmaydi — subjectId null bo'ladi (schema: onDelete SetNull)
  await prisma.subject.delete({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
});

module.exports = router;
