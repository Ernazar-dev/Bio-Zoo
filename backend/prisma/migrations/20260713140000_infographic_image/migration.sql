-- Infografika endi tayyor rasm (mental karta) sifatida yuklanadi.
-- imageUrl qo'shiladi, centerLabel esa majburiy bo'lmay qoladi
-- (eski blokli yozuvlar bilan moslik saqlanadi).

ALTER TABLE "infographics" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "infographics" ALTER COLUMN "centerLabel" DROP NOT NULL;
