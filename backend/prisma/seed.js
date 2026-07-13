require('dotenv').config();
const prisma = require('../src/utils/prisma');

// Admin panel credentials now live in .env (ADMIN_LOGIN / ADMIN_PASSWORD),
// not in the users table — nothing to seed here.

async function main() {
  const umurtqasizlar = await prisma.category.upsert({
    where: { slug: 'umurtqasizlar' },
    update: {},
    create: {
      name: 'Umurtqasizlar',
      slug: 'umurtqasizlar',
      description: 'Umurtqasi bo\'lmagan hayvonlar dunyosi',
      order: 1,
    },
  });

  const umurtqalilar = await prisma.category.upsert({
    where: { slug: 'umurtqalilar' },
    update: {},
    create: {
      name: 'Umurtqalilar',
      slug: 'umurtqalilar',
      description: 'Umurtqali hayvonlar dunyosi',
      order: 2,
    },
  });

  await prisma.topic.createMany({
    skipDuplicates: true,
    data: [
      { categoryId: umurtqasizlar.id, title: 'Kletka', description: 'Tirik organizm asosiy birligi', has3DModel: true, order: 1 },
      { categoryId: umurtqasizlar.id, title: 'Hasharotlar', description: 'Hasharotlar sinfi', order: 2 },
      { categoryId: umurtqasizlar.id, title: 'Mollyuskalar', description: 'Mollyuskalar tipi', order: 3 },
      { categoryId: umurtqalilar.id, title: 'Baliqlar', description: 'Baliqlar sinfi', order: 1 },
      { categoryId: umurtqalilar.id, title: 'Sudralib yuruvchilar', description: 'Reptiliyalar sinfi', order: 2 },
      { categoryId: umurtqalilar.id, title: 'Sut emizuvchilar', description: 'Mammaliyalar sinfi', order: 3 },
    ],
  });

  console.log('Seed muvaffaqiyatli yakunlandi!');
}

main().finally(() => prisma.$disconnect());
