-- Fanlar (Subject) darajasi va interaktiv infografikalar qo'shildi.
-- Lokal bazada bu o'zgarishlar `prisma db push` bilan allaqachon bo'lishi
-- mumkin, shuning uchun barcha amallar shartli — migratsiya har qanday
-- holatdagi bazada xatosiz ishlaydi.

-- MaterialType enum'iga yangi qiymatlar
ALTER TYPE "MaterialType" ADD VALUE IF NOT EXISTS 'PRESENTATION';
ALTER TYPE "MaterialType" ADD VALUE IF NOT EXISTS 'INFOGRAPHIC';

-- InfographicLayout enum (CREATE TYPE'da IF NOT EXISTS yo'q)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InfographicLayout') THEN
    CREATE TYPE "InfographicLayout" AS ENUM ('RADIAL', 'TIMELINE');
  END IF;
END $$;

-- Fanlar jadvali
CREATE TABLE IF NOT EXISTS "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "subjects_slug_key" ON "subjects"("slug");

-- Kategoriya endi fanga bog'lanadi (ixtiyoriy)
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "subjectId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_subjectId_fkey') THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_subjectId_fkey"
      FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Interaktiv infografikalar jadvali
CREATE TABLE IF NOT EXISTS "infographics" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "centerLabel" TEXT NOT NULL,
    "layout" "InfographicLayout" NOT NULL DEFAULT 'RADIAL',
    "note" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "blocks" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infographics_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'infographics_topicId_fkey') THEN
    ALTER TABLE "infographics" ADD CONSTRAINT "infographics_topicId_fkey"
      FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
