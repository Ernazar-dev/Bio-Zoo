const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

const KINDS = ['MODEL_3D', 'SIMULATION', 'VIRTUAL_LAB'];

// Iframe faqat shu domenlardan ochiladi — o'zboshimcha sayt qo'yib bo'lmaydi
const ALLOWED_HOSTS = [
  'sketchfab.com',
  'phet.colorado.edu',
  'javalab.org',
  'biologysimulations.com',
  'labxchange.org',
  '3d.si.edu',
  'human.biodigital.com',
  'youtube.com',
  'youtube-nocookie.com',
];

function isAllowedEmbedUrl(value) {
  if (typeof value !== 'string' || value.length > 1000) return false;
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    return ALLOWED_HOSTS.some((d) => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

// Mavzuning interaktiv resurslari
router.get('/topic/:topicId', async (req, res) => {
  const items = await prisma.interactive.findMany({
    where: { topicId: req.params.topicId },
    orderBy: { order: 'asc' },
  });
  res.json(items);
});

// Frontendga ruxsat etilgan domenlar ro'yxati (admin formadagi eslatma uchun)
router.get('/allowed-hosts', (req, res) => res.json(ALLOWED_HOSTS));

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { topicId, kind, title, embedUrl, description, order } = req.body;
  if (!topicId || !title || !embedUrl) return res.status(400).json({ message: 'Majburiy maydanlar toldırılmaǵan' });
  if (!isAllowedEmbedUrl(embedUrl)) {
    return res.status(400).json({ message: 'Bul siltewge ruxsat joq. Tek: ' + ALLOWED_HOSTS.join(', ') });
  }
  try {
    const item = await prisma.interactive.create({
      data: {
        topicId,
        kind: KINDS.includes(kind) ? kind : 'MODEL_3D',
        title: String(title).slice(0, 200),
        embedUrl: String(embedUrl).trim(),
        description: description ? String(description).slice(0, 1000) : null,
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
  const { kind, title, embedUrl, description, order } = req.body;
  if (embedUrl !== undefined && !isAllowedEmbedUrl(embedUrl)) {
    return res.status(400).json({ message: 'Bul siltewge ruxsat joq. Tek: ' + ALLOWED_HOSTS.join(', ') });
  }
  try {
    const item = await prisma.interactive.update({
      where: { id: req.params.id },
      data: {
        kind: kind !== undefined ? (KINDS.includes(kind) ? kind : 'MODEL_3D') : undefined,
        title: title !== undefined ? String(title).slice(0, 200) : undefined,
        embedUrl: embedUrl !== undefined ? String(embedUrl).trim() : undefined,
        description: description !== undefined ? (description ? String(description).slice(0, 1000) : null) : undefined,
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
  await prisma.interactive.delete({ where: { id: req.params.id } });
  res.json({ message: 'Óshirildi' });
});

module.exports = router;
