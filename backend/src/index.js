require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const categoryRoutes = require('./routes/categories');
const topicRoutes = require('./routes/topics');
const materialRoutes = require('./routes/materials');
const quizRoutes = require('./routes/quizzes');
const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const fileRoutes = require('./routes/files');
const aiRoutes = require('./routes/ai');
const infographicRoutes = require('./routes/infographics');
const interactiveRoutes = require('./routes/interactives');

const app = express();
const PORT = process.env.PORT || 5000;

// Render proksi ortida ishlaydi — req.protocol to'g'ri (https) bo'lishi uchun
app.set('trust proxy', 1);

// Ruxsat etilgan frontend manzillari: lokal dev + FRONTEND_URL (vergul bilan bir nechta)
const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()) : []),
];
// Xavfsizlik headerlari (X-Content-Type-Options, X-Frame-Options, HSTS va h.k.)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({ origin: allowedOrigins, credentials: true }));
// JSON hajmi cheklovi — katta payload bilan xotirani to'ldirish (DoS) oldini oladi
app.use(express.json({ limit: '200kb' }));

// Umumiy rate limit — bitta IP dan daqiqasiga 300 ta so'rov
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "So'rovlar soni ko'payib ketdi, birozdan so'ng urinib ko'ring" },
  })
);

// Auth endpointlari uchun qattiqroq limit — parolni brute-force qilishdan himoya
app.use(
  ['/api/auth/login', '/api/auth/register'],
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: "Juda ko'p urinish. 15 daqiqadan so'ng qayta urinib ko'ring" },
  })
);
// Lokal devda eski diskdagi fayllar uchun (deployda fayllar DB da)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/infographics', infographicRoutes);
app.use('/api/interactives', interactiveRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Noma'lum API yo'llari uchun JSON 404
app.use('/api', (req, res) => res.status(404).json({ message: 'Topilmadi' }));

// Global xato ushlagich — mijozga har doim JSON qaytadi (HTML emas)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    const maxMb = process.env.MAX_FILE_SIZE_MB || '25';
    return res.status(400).json({ message: `Fayl hajmi ${maxMb} MB dan oshmasligi kerak` });
  }
  const status = err.status || 500;
  // Ichki xato tafsilotlari (stack, Prisma/DB xabarlari) mijozga chiqarilmaydi
  const message = status < 500 && err.message ? err.message : 'Server xatosi';
  res.status(status).json({ message });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
