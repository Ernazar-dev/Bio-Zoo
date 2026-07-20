const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// Render free tierda doimiy disk yo'q — fayl xotirada qabul qilinib,
// Postgres (Neon) ichiga bytea sifatida yoziladi
const MAX_FILE_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '25', 10);

// Kengaytma ham, mimetype ham oq ro'yxatdan o'tishi shart.
// Regex ^...$ bilan ankorlanadi — aks holda "xjpgx" kabi kengaytmalar ham o'tib ketardi.
const ALLOWED_EXT = /^(jpeg|jpg|png|gif|webp|mp4|webm|glb|gltf|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar)$/;
// text/html, image/svg+xml kabi brauzerda skript ishlata oladigan turlar ataylab yo'q —
// ular /api/files orqali inline ochilganda stored-XSS ga olib kelishi mumkin
const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm',
  'model/gltf-binary', 'model/gltf+json',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip', 'application/x-zip-compressed',
  'application/vnd.rar', 'application/x-rar-compressed',
  'application/octet-stream',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  cb(null, ALLOWED_EXT.test(ext) && ALLOWED_MIME.has(file.mimetype));
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
});

router.post('/', authenticate, adminOnly, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Fayl júklenbedi' });

    // originalname multipart'da latin1 bo'lib keladi — UTF-8 ga qaytaramiz.
    // Boshqaruv belgilari olib tashlanadi (header-injection oldini olish), uzunlik cheklanadi.
    const filename = Buffer.from(req.file.originalname, 'latin1')
      .toString('utf8')
      .replace(/[\x00-\x1f\x7f"\\]/g, '')
      .slice(0, 200) || 'file';

    const file = await prisma.storedFile.create({
      data: {
        filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      },
      select: { id: true, filename: true, mimetype: true, size: true },
    });

    // Fayl nomi URL oxiriga qo'shiladi — frontend fayl turini (.pdf, .docx...)
    // kengaytmadan aniqlay olishi uchun. Server uni e'tiborsiz qoldiradi.
    const url = `${req.protocol}://${req.get('host')}/api/files/${file.id}/${encodeURIComponent(file.filename)}`;
    res.json({ url, filename: file.filename, mimetype: file.mimetype });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
