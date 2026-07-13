-- Quiz modeli savol-javob tuzilishidan fayl (Word/PDF) + javoblar kaliti
-- tuzilishiga o'tdi. Eski formatdagi test yozuvlari yangi model bilan mos
-- kelmaydi, shuning uchun jadval o'zgartirilishidan oldin ular tozalanadi.
-- Barcha amallar shartli (IF EXISTS) — migratsiya har qanday holatdagi
-- bazada xatosiz ishlaydi.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'quizzes' AND column_name = 'question') THEN
    DELETE FROM "quiz_results";
    DELETE FROM "quizzes";
  END IF;
END $$;

ALTER TABLE "quizzes"
  DROP COLUMN IF EXISTS "question",
  DROP COLUMN IF EXISTS "options",
  DROP COLUMN IF EXISTS "correctIndex",
  DROP COLUMN IF EXISTS "points",
  DROP COLUMN IF EXISTS "explanation",
  DROP COLUMN IF EXISTS "order",
  ADD COLUMN IF NOT EXISTS "fileUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "fileType" TEXT,
  ADD COLUMN IF NOT EXISTS "questionCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "timeLimit" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "answerKey" JSONB;

ALTER TABLE "quiz_results"
  DROP COLUMN IF EXISTS "isCorrect",
  ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "correctCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "totalCount" INTEGER NOT NULL DEFAULT 0;

-- email -> login o'zgarishida indeks eski nomida qolgan edi
ALTER INDEX IF EXISTS "users_email_key" RENAME TO "users_login_key";
