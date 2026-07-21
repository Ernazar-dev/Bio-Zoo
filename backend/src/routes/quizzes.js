const router = require('express').Router();
const prisma = require('../utils/prisma');
const { authenticate, adminOnly } = require('../middleware/auth');
const { isSafeUrl } = require('../utils/validate');

// answerKey formati: {"1": "A", "2": "B", ...} — kalit savol raqami, qiymat A-D.
// Noto'g'ri formatdagi kalit saqlansa, studentlar testni umuman topshira olmay qolardi.
const isValidAnswerKey = (ak) => {
  if (ak === undefined || ak === null) return true;
  if (typeof ak !== 'object' || Array.isArray(ak)) return false;
  const entries = Object.entries(ak);
  if (entries.length > 500) return false;
  return entries.every(([k, v]) => /^\d{1,3}$/.test(k) && /^[A-D]$/.test(String(v)));
};

router.get('/topic/:topicId', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  let isAdmin = false;
  if (token) {
    try {
      const decoded = require('jsonwebtoken').verify(token, process.env.JWT_ACCESS_SECRET);
      if (decoded && decoded.role === 'ADMIN') {
        isAdmin = true;
      }
    } catch (e) {}
  }

  const quizzes = await prisma.quiz.findMany({
    where: { topicId: req.params.topicId },
    orderBy: { createdAt: 'asc' },
  });

  if (!isAdmin) {
    // Hide answerKey for students
    quizzes.forEach(quiz => {
      delete quiz.answerKey;
    });
  }

  res.json(quizzes);
});

router.post('/', authenticate, adminOnly, async (req, res) => {
  const { topicId, fileUrl, fileType, questionCount, timeLimit, answerKey } = req.body;
  if (!isSafeUrl(fileUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  if (!isValidAnswerKey(answerKey)) return res.status(400).json({ message: 'Juwaplar gilti formatı qáte' });
  const parsedQC = questionCount !== undefined && questionCount !== null && questionCount !== '' ? parseInt(questionCount, 10) : 0;
  const parsedTL = timeLimit !== undefined && timeLimit !== null && timeLimit !== '' ? parseInt(timeLimit, 10) : 0;
  try {
    const quiz = await prisma.quiz.create({
      data: {
        topicId,
        fileUrl,
        fileType,
        questionCount: isNaN(parsedQC) ? 0 : parsedQC,
        timeLimit: isNaN(parsedTL) ? 0 : parsedTL,
        answerKey,
      },
    });
    res.status(201).json(quiz);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

// Admin gets results for a specific quiz
router.get('/:id/results', authenticate, adminOnly, async (req, res) => {
  try {
    const results = await prisma.quizResult.findMany({
      where: { quizId: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            login: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(results);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.put('/:id', authenticate, adminOnly, async (req, res) => {
  const { fileUrl, fileType, questionCount, timeLimit, answerKey } = req.body;
  if (!isSafeUrl(fileUrl)) return res.status(400).json({ message: 'URL tek http(s) bolıwı múmkin' });
  if (!isValidAnswerKey(answerKey)) return res.status(400).json({ message: 'Juwaplar gilti formatı qáte' });
  const parsedQC = questionCount !== undefined && questionCount !== null && questionCount !== '' ? parseInt(questionCount, 10) : undefined;
  const parsedTL = timeLimit !== undefined && timeLimit !== null && timeLimit !== '' ? parseInt(timeLimit, 10) : undefined;
  try {
    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: {
        fileUrl,
        fileType,
        questionCount: parsedQC !== undefined && !isNaN(parsedQC) ? parsedQC : undefined,
        timeLimit: parsedTL !== undefined && !isNaN(parsedTL) ? parsedTL : undefined,
        answerKey,
      },
    });
    res.json(quiz);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: 'Ma\'lumotlar qáte' });
  }
});

router.delete('/:id', authenticate, adminOnly, async (req, res) => {
  await prisma.quiz.delete({ where: { id: req.params.id } });
  res.json({ message: 'Óshirildi' });
});

// Student submits quiz answer
router.post('/:id/answer', authenticate, async (req, res) => {
  const { answers } = req.body; // e.g. {"1": "A", "2": "B", ...}
  const userId = req.user.userId;
  if (!userId) return res.status(403).json({ message: 'Tek studentler test tapsıra aladı' });
  if (!answers || typeof answers !== 'object' || Array.isArray(answers))
    return res.status(400).json({ message: 'Juwaplar jiberilmedi' });
  // Javoblar formati qattiq tekshiriladi: kalit — savol raqami, qiymat — A-D harfi
  const entries = Object.entries(answers);
  if (entries.length > 500)
    return res.status(400).json({ message: 'Juwaplar formatı qáte' });
  for (const [key, value] of entries) {
    if (!/^\d{1,3}$/.test(key) || !/^[A-D]$/.test(String(value)))
      return res.status(400).json({ message: 'Juwaplar formatı qáte' });
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.id } });
  if (!quiz) return res.status(404).json({ message: 'Tabılmadı' });

  const answerKey = quiz.answerKey || {}; // e.g. {"1": "A", "2": "B", ...}
  const totalCount = quiz.questionCount || 0;

  let correctCount = 0;
  for (let i = 1; i <= totalCount; i++) {
    if (answers[String(i)] === answerKey[String(i)]) {
      correctCount++;
    }
  }

  const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;
  
  // Award points based on performance: max 10 points
  const earnedPoints = totalCount > 0 ? Math.round((correctCount / totalCount) * 10) : 0;

  const already = await prisma.quizResult.findUnique({
    where: { userId_quizId: { userId, quizId: quiz.id } }
  });

  if (already) {
    return res.json({ ...already, alreadyAnswered: true });
  }

  let result;
  try {
    result = await prisma.quizResult.create({
      data: { userId, quizId: quiz.id, score, correctCount, totalCount, earnedPoints },
    });
  } catch (e) {
    // Parallel ikki so'rov kelganda unique cheklov ishlaydi —
    // avval saqlangan natijani qaytaramiz, ball ikki marta qo'shilmaydi
    const existing = await prisma.quizResult.findUnique({
      where: { userId_quizId: { userId, quizId: quiz.id } },
    });
    if (existing) return res.json({ ...existing, alreadyAnswered: true });
    throw e;
  }

  if (earnedPoints > 0) {
    await prisma.user.update({ where: { id: userId }, data: { points: { increment: earnedPoints } } });
    await prisma.userActivity.create({
      data: { userId, action: 'QUIZ_CORRECT', points: earnedPoints, meta: { quizId: quiz.id, score } }
    });
  }

  res.json({
    id: result.id,
    score: result.score,
    correctCount: result.correctCount,
    totalCount: result.totalCount,
    earnedPoints: result.earnedPoints,
    alreadyAnswered: false,
  });
});

module.exports = router;
