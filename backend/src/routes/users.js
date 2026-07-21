const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');

// Public stats for the landing page
router.get('/stats', async (req, res) => {
  const [categories, topics, students] = await Promise.all([
    prisma.category.count(),
    prisma.topic.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
  ]);
  res.json({ categories, topics, students });
});

// Leaderboard
router.get('/leaderboard', async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { points: 'desc' },
    take: 50,
    select: { id: true, name: true, points: true, avatar: true, createdAt: true },
  });
  res.json(users);
});

// Current user profile
router.get('/me', authenticate, async (req, res) => {
  // Admin bazada saqlanmaydi — unga statik profil qaytariladi
  if (!req.user.userId) {
    return res.json({ id: 'admin', name: 'Admin', login: '', role: 'ADMIN', points: 0, avatar: null });
  }
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, name: true, login: true, role: true, points: true, avatar: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ message: 'Tabılmadı' });
  res.json(user);
});

// Admin: all students
router.get('/', authenticate, adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, login: true, role: true, points: true, createdAt: true },
  });
  res.json(users);
});

// O'quvchining umumiy va mavzular bo'yicha progressi (bosh sahifa uchun)
router.get('/me/progress', authenticate, async (req, res) => {
  const empty = { totalQuizzes: 0, mastered: 0, learning: 0, remaining: 0, percent: 0, byTopic: [] };
  if (!req.user.userId) return res.json(empty);

  const [quizzes, results] = await Promise.all([
    prisma.quiz.findMany({ select: { id: true, topicId: true } }),
    prisma.quizResult.findMany({
      where: { userId: req.user.userId },
      select: { quizId: true, score: true },
    }),
  ]);

  if (quizzes.length === 0) return res.json(empty);

  const scoreByQuiz = new Map(results.map((r) => [r.quizId, r.score]));
  let mastered = 0;
  let learning = 0;
  const topicAgg = new Map(); // topicId -> { total, passed }

  for (const q of quizzes) {
    const agg = topicAgg.get(q.topicId) || { total: 0, passed: 0 };
    agg.total += 1;
    if (scoreByQuiz.has(q.id)) {
      const score = scoreByQuiz.get(q.id);
      if (score >= 60) {
        mastered += 1;
        agg.passed += 1;
      } else {
        learning += 1;
      }
    }
    topicAgg.set(q.topicId, agg);
  }

  const remaining = quizzes.length - mastered - learning;
  const byTopic = [...topicAgg.entries()].map(([topicId, a]) => ({
    topicId,
    percent: Math.round((a.passed / a.total) * 100),
  }));

  res.json({
    totalQuizzes: quizzes.length,
    mastered,
    learning,
    remaining,
    percent: Math.round((mastered / quizzes.length) * 100),
    byTopic,
  });
});

// O'quvchining reytingdagi o'rni
router.get('/me/rank', authenticate, async (req, res) => {
  if (!req.user.userId) return res.json({ rank: 0, total: 0 });
  const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { points: true } });
  if (!me) return res.status(404).json({ message: 'Tabılmadı' });
  const [higher, total] = await Promise.all([
    prisma.user.count({ where: { role: 'STUDENT', points: { gt: me.points } } }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
  ]);
  res.json({ rank: higher + 1, total, points: me.points });
});

// Portfolio — topshirilgan testlar (mavzu va bo'lim nomi bilan)
router.get('/me/portfolio', authenticate, async (req, res) => {
  if (!req.user.userId) return res.json([]);
  const results = await prisma.quizResult.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, score: true, correctCount: true, totalCount: true, earnedPoints: true, createdAt: true,
      quiz: { select: { topic: { select: { id: true, title: true, category: { select: { name: true } } } } } },
    },
  });
  res.json(results);
});

// User activity history
router.get('/me/activity', authenticate, async (req, res) => {
  // userId bo'lmasa (admin) filtrsiz so'rov BARCHA foydalanuvchilar
  // faoliyatini qaytarib yuborardi — bo'sh ro'yxat qaytaramiz
  if (!req.user.userId) return res.json([]);
  const activities = await prisma.userActivity.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });
  res.json(activities);
});

// My quiz results for a topic
router.get('/me/quiz-results/:topicId', authenticate, async (req, res) => {
  if (!req.user.userId) return res.json([]);
  const results = await prisma.quizResult.findMany({
    where: { userId: req.user.userId, quiz: { topicId: req.params.topicId } },
    select: { id: true, quizId: true, score: true, correctCount: true, totalCount: true, earnedPoints: true },
  });
  res.json(results);
});

// Admin: studentni o'chirish
router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: 'Student tabılmadı' });
    if (user.role === 'ADMIN') return res.status(403).json({ message: 'Admin hesabın óshiriw múmkin emes' });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Óshirildi' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Óshiriwde qátelik júz berdi' });
  }
});

module.exports = router;
