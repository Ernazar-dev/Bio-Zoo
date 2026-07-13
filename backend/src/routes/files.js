const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// DB (Neon) ichida saqlangan faylni uzatish.
// Video seek ishlashi uchun Range so'rovlari qo'llab-quvvatlanadi.
// Ixtiyoriy {/:name} segmenti faqat URL'da kengaytma ko'rinishi uchun —
// fayl doim id bo'yicha topiladi.
router.get('/:id{/:name}', async (req, res, next) => {
  try {
    const file = await prisma.storedFile.findUnique({ where: { id: req.params.id } });
    if (!file) return res.status(404).json({ message: 'Fayl topilmadi' });

    const data = Buffer.from(file.data);
    const total = data.length;

    // Brauzer skript ishlata oladigan turlar (html, svg, xml...) hech qachon
    // inline ochilmasligi kerak — stored-XSS dan himoya. Bunday fayllar
    // application/octet-stream sifatida faqat yuklab olishga beriladi.
    const SAFE_INLINE = /^(image\/(jpeg|png|gif|webp)|video\/(mp4|webm)|application\/pdf|text\/plain)$/;
    const inlineSafe = SAFE_INLINE.test(file.mimetype);
    const mimetype = inlineSafe ? file.mimetype : 'application/octet-stream';

    res.setHeader('Content-Type', mimetype);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Frontend alohida origin'da — PDF/rasm iframe'da ochilishi uchun
    // helmet qo'ygan frame cheklovlarini shu route'da olib tashlaymiz
    res.removeHeader('X-Frame-Options');
    res.setHeader(
      'Content-Security-Policy',
      inlineSafe ? "default-src 'none'; frame-ancestors *" : "default-src 'none'; sandbox"
    );
    res.setHeader('Accept-Ranges', 'bytes');
    // id o'zgarmas (uuid) — brauzer bemalol keshlashi mumkin
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader(
      'Content-Disposition',
      `${inlineSafe ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.filename)}`
    );
    // Frontend eski (kengaytmasiz) URL'larda fayl turini shu sarlavhadan aniqlaydi
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? parseInt(range[1], 10) : 0;
      const end = range[2] ? Math.min(parseInt(range[2], 10), total - 1) : total - 1;
      if (start >= total || start > end) {
        res.setHeader('Content-Range', `bytes */${total}`);
        return res.status(416).end();
      }
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      return res.end(data.subarray(start, end + 1));
    }

    res.end(data);
  } catch (err) {
    next(err);
  }
});

// Neon free tier 512 MB — keraksiz fayllarni o'chirib turish uchun
router.delete('/:id', authenticate, adminOnly, async (req, res, next) => {
  try {
    await prisma.storedFile.delete({ where: { id: req.params.id } });
    res.json({ message: "Fayl o'chirildi" });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ message: 'Fayl topilmadi' });
    next(err);
  }
});

module.exports = router;
