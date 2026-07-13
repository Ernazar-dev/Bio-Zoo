-- Interaktiv resurslar (Sketchfab 3D, PhET/JavaLab simulyatsiyalari) —
-- mavzu sahifasida iframe orqali ochiladi. Amallar shartli yozilgan,
-- har qanday holatdagi bazada xatosiz ishlaydi.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'InteractiveKind') THEN
    CREATE TYPE "InteractiveKind" AS ENUM ('MODEL_3D', 'SIMULATION', 'VIRTUAL_LAB');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "interactives" (
    "id" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "kind" "InteractiveKind" NOT NULL DEFAULT 'MODEL_3D',
    "title" TEXT NOT NULL,
    "embedUrl" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactives_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interactives_topicId_fkey') THEN
    ALTER TABLE "interactives" ADD CONSTRAINT "interactives_topicId_fkey"
      FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
