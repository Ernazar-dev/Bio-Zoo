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

// Nomdan slug yasaydi: "Sudralib yuruvchilar" -> "sudralib-yuruvchilar"
const slugify = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[а-яёўқғҳ]/g, (ch) => CYRILLIC_MAP[ch] ?? ch)
    .replace(/[ʻʼ'’`]/g, '') // o'zbekcha apostroflar: o', g'
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'kategoriya';

// Slug band bo'lsa oxiriga -2, -3 ... qo'shib takrorlanmasini topadi
const uniqueSlug = async (name) => {
  const base = slugify(name);
  let slug = base;
  for (let i = 2; await prisma.category.findUnique({ where: { slug } }); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
};

router.get('/', async (req, res) => {
  // Ixtiyoriy filtr: ?subjectId=... yoki ?subjectSlug=...
  const { subjectId, subjectSlug } = req.query;
  const where = {};
  if (subjectId) where.subjectId = String(subjectId);
  if (subjectSlug) where.subject = { slug: String(subjectSlug) };
  const categories = await prisma.category.findMany({
    where,
    orderBy: { order: 'asc' },
    include: {
      _count: { select: { topics: true } },
      subject: { select: { id: true, name: true, slug: true } },
    },
  });
  res.json(categories);
});

router.get('/:slug', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: {
      topics: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          coverImage: true,
          has3DModel: true,
          order: true,
          _count: {
            select: {
              materials: true,
              quizzes: true,
              gameLinks: true,
            },
          },
        },
      },
    },
  });
  if (!category) return res.status(404).json({ message: 'Tabılmadı' });
  res.json(category);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { name, description, imageUrl, order, subjectId } = req.body;
  if (!isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  const parsedOrder = order !== undefined && order !== null && order !== '' ? parseInt(order, 10) : 0;
  try {
    const slug = req.body.slug || (await uniqueSlug(name));
    const category = await prisma.category.create({
      data: { name, slug, description, imageUrl, order: isNaN(parsedOrder) ? 0 : parsedOrder, subjectId: subjectId || null },
    });
    res.status(201).json(category);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { name, slug, description, imageUrl, order, subjectId } = req.body;
  if (!isSafeUrl(imageUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  const parsedOrder = order !== undefined && order !== null && order !== '' ? parseInt(order, 10) : undefined;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        slug,
        description,
        imageUrl,
        order: parsedOrder !== undefined && !isNaN(parsedOrder) ? parsedOrder : undefined,
        subjectId: subjectId === undefined ? undefined : (subjectId || null),
      },
    });
    res.json(category);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'O\'chirildi' });
});

module.exports = router;
