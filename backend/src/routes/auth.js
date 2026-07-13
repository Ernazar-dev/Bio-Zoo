const router = require('express').Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { generateTokens } = require('../utils/jwt');

// Constant-time string comparison to avoid leaking admin credentials via timing
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a ?? ''));
  const bufB = Buffer.from(String(b ?? ''));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

// Register
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name ?? '').trim();
    const login = String(req.body.login ?? '').trim();
    const password = String(req.body.password ?? '');
    if (!name || !login || !password)
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring' });
    if (name.length > 64)
      return res.status(400).json({ message: 'Ism 64 ta belgidan oshmasligi kerak' });
    if (!/^[a-zA-Z0-9_.@-]{3,32}$/.test(login))
      return res.status(400).json({ message: 'Login 3-32 ta belgi: harf, raqam, _ . @ - bo\'lishi mumkin' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    // bcrypt 72 baytdan keyin qirqadi; juda uzun parol hashlash orqali DoS oldini olamiz
    if (password.length > 72)
      return res.status(400).json({ message: 'Parol 72 ta belgidan oshmasligi kerak' });
    if (safeEqual(login, process.env.ADMIN_LOGIN))
      return res.status(400).json({ message: 'Bu login allaqachon mavjud' });

    const exists = await prisma.user.findUnique({ where: { login } });
    if (exists) return res.status(400).json({ message: 'Bu login allaqachon mavjud' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, login, password: hashed },
    });

    // Ball faqat test natijasi uchun beriladi — ro'yxatdan o'tish uchun bonus yo'q
    await prisma.userActivity.create({
      data: { userId: user.id, action: 'REGISTER', points: 0 },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, login: user.login, role: user.role, points: 0 },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Login — single entry point for both students and the admin.
// Admin credentials live only in .env and never touch the database.
router.post('/login', async (req, res) => {
  try {
    // String'ga majburlash — body orqali obyekt yuborib Prisma filtrlarini
    // manipulyatsiya qilishning (NoSQL-injection uslubidagi hujum) oldini oladi
    const login = typeof req.body.login === 'string' ? req.body.login.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!login || !password)
      return res.status(400).json({ message: 'Login va parolni kiriting' });
    if (login.length > 128 || password.length > 128)
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });

    if (safeEqual(login, process.env.ADMIN_LOGIN) && safeEqual(password, process.env.ADMIN_PASSWORD)) {
      const accessToken = jwt.sign({ role: 'ADMIN', admin: true }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ role: 'ADMIN', admin: true }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      return res.json({
        accessToken,
        refreshToken,
        user: { id: 'admin', name: 'Admin', login: process.env.ADMIN_LOGIN, role: 'ADMIN', points: 0, createdAt: new Date().toISOString() },
      });
    }

    const user = await prisma.user.findUnique({ where: { login } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Login yoki parol noto\'g\'ri' });

    // Ball faqat test natijasi uchun beriladi — kunlik kirish bonusi yo'q

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } });

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    res.json({
      accessToken,
      refreshToken,
      user: { id: updated.id, name: updated.name, login: updated.login, role: updated.role, points: updated.points },
    });
  } catch (e) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken || typeof refreshToken !== 'string')
      return res.status(401).json({ message: 'Token kerak' });

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (payload.admin) {
      const accessToken = jwt.sign({ role: 'ADMIN', admin: true }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
      const newRefreshToken = jwt.sign({ role: 'ADMIN', admin: true }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      return res.json({ accessToken, refreshToken: newRefreshToken });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ message: 'Token yaroqsiz' });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ message: 'Token yaroqsiz' });
    const tokens = generateTokens(user.id, user.role);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({ data: { token: tokens.refreshToken, userId: user.id, expiresAt } });

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Token yaroqsiz' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken && typeof refreshToken === 'string')
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  res.json({ message: 'Chiqildi' });
});

module.exports = router;
