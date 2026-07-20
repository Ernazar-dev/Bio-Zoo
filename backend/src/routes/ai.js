const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const prisma = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

// AI so'rovlari uchun alohida qattiqroq limit — bepul API kvotasini asrash uchun
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: "AI sorawları kóbeyip ketti, azǵantaydan soń urınıp kórıń" },
});

// Provayderni env orqali ulash mumkin (keyin kalit qo'shiladi):
//   AI_PROVIDER=gemini | grok
//   AI_API_KEY=...   (yoki GEMINI_API_KEY / GROK_API_KEY)
const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
const API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GROK_API_KEY || '';

const SYSTEM_PROMPT = (topicTitle, context) => `Sen "Biometod AI" bilim beriw platformasınıń biologiya boyınsha járdemshisisen.
Faqat qaraqalpaq tilinde, ápiwayı hám túsinikli juwap ber. Juwaplarıń biologiya/zoologiya páni sheńberinde bolsın.
${topicTitle ? `Házirgi tema: "${topicTitle}".` : ''}
${context ? `Tema boyınsha maǵlıwmat:\n${context}` : ''}`;

// Mavzu matnidan qisqa kontekst yig'ish (nazariy materiallar)
async function buildContext(topicId) {
  // Faqat string qabul qilinadi — obyekt yuborib Prisma so'rovini
  // manipulyatsiya qilishning oldini oladi
  if (!topicId || typeof topicId !== 'string') return { title: '', context: '' };
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { materials: { where: { type: { in: ['TEXT'] } }, take: 3 } },
  });
  if (!topic) return { title: '', context: '' };
  const context = [topic.description, ...topic.materials.map(m => m.content)]
    .filter(Boolean).join('\n').slice(0, 4000);
  return { title: topic.title, context };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(system, messages, modelOverride) {
  // gemini-2.5-flash-lite — bepul kvotasi eng yuqori model (2.0-flash'niki qisqargan)
  const model = modelOverride || process.env.AI_MODEL || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }],
  }));
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents,
      generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Gemini xatosi: ${res.status} ${body.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || 'Juwap alınbadı.';
}

// Gemini vaqtincha band bo'lsa (503) qisqa pauza bilan qayta uriniladi,
// oxirgi urinishda zaxira modelga o'tiladi
async function callGeminiResilient(system, messages) {
  const attempts = [undefined, undefined, 'gemini-2.5-flash'];
  let lastErr;
  for (let i = 0; i < attempts.length; i++) {
    try {
      return await callGemini(system, messages, attempts[i]);
    } catch (e) {
      if (e.status !== 503) throw e;
      lastErr = e;
      if (i < attempts.length - 1) await sleep(1000 * (i + 1));
    }
  }
  throw lastErr;
}

async function callGrok(system, messages) {
  const model = process.env.AI_MODEL || 'grok-2-latest';
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 800,
      messages: [{ role: 'system', content: system }, ...messages],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Grok xatosi: ${res.status} ${body.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || 'Juwap alınbadı.';
}

router.post('/chat', authenticate, aiLimiter, async (req, res) => {
  const { topicId, messages } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ message: 'Xabar bos' });
  }
  // Faqat kerakli maydonlar, uzunlik cheklovi bilan
  const clean = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }));

  // Kalit sozlanmagan — izohli javob (front configured=false ni ko'radi)
  if (!API_KEY) {
    return res.json({
      configured: false,
      reply:
        "AI Járdemshi házirshe ulanbaǵan. Administrator biypul AI API kiltin (Gemini yamasa Grok) " +
        "sozlaǵannan soń, bul jerde tema boyınsha soraw-juwap etiwińiz múmkin boladı.",
    });
  }

  try {
    const { title, context } = await buildContext(topicId);
    const system = SYSTEM_PROMPT(title, context);
    const reply = PROVIDER === 'grok'
      ? await callGrok(system, clean)
      : await callGeminiResilient(system, clean);
    res.json({ configured: true, reply });
  } catch (e) {
    console.error('AI error:', e.message);
    // Kvota/limit xatolari foydalanuvchiga tushunarli qilib qaytariladi
    if (e.status === 429) {
      return res.status(429).json({ message: "AI kvotası waqıtsha tawısıldı (biypul limit). Bir minuttan soń qaytadan urınıp kórıń." });
    }
    if (e.status === 401 || e.status === 403) {
      return res.status(502).json({ message: 'AI API kilti qáte yamasa ruxsat joq. Administrator kilti tekshersin.' });
    }
    if (e.status === 404) {
      return res.status(502).json({ message: 'AI modeli tabılmadı. Administrator AI_MODEL sozlamasın tekserip kórsin.' });
    }
    if (e.status === 503) {
      return res.status(503).json({ message: "AI házir júda bánt (Google tárepinde). Bir-eki minuttan soń qaytadan urınıp kórıń." });
    }
    res.status(502).json({ message: "AI járdemshiden juwap alıwda qátelik. Azǵantaydan soń qaytadan urınıp kórıń." });
  }
});

module.exports = router;
