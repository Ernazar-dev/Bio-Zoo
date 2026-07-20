require('dotenv').config();
const prisma = require('../src/utils/prisma');

// Admin panel credentials now live in .env (ADMIN_LOGIN / ADMIN_PASSWORD),
// not in the users table — nothing to seed here.

async function main() {
  const omortqasizlar = await prisma.category.upsert({
    where: { slug: 'omortqasizlar' },
    update: {},
    create: {
      name: 'Omortqasızlar',
      slug: 'omortqasizlar',
      description: 'Omortqası bolmaǵan haywanlar dúnyası',
      order: 1,
    },
  });

  const omortqalilar = await prisma.category.upsert({
    where: { slug: 'omortqalilar' },
    update: {},
    create: {
      name: 'Omortqalılar',
      slug: 'omortqalilar',
      description: 'Omortqalı haywanlar dúnyası',
      order: 2,
    },
  });

  await prisma.topic.createMany({
    skipDuplicates: true,
    data: [
      { categoryId: omortqasizlar.id, title: 'Kletka', description: 'Tiri organizm tiykarǵı birligi', has3DModel: true, order: 1 },
      { categoryId: omortqasizlar.id, title: 'Qurt-qumırsqalar', description: 'Qurt-qumırsqalar klası', order: 2 },
      { categoryId: omortqasizlar.id, title: 'Mollyuskalar', description: 'Mollyuskalar tipi', order: 3 },
      { categoryId: omortqalilar.id, title: 'Balıqlar', description: 'Balıqlar klası', order: 1 },
      { categoryId: omortqalilar.id, title: 'Súyrelip júriwshiler', description: 'Reptiliyalar klası', order: 2 },
      { categoryId: omortqalilar.id, title: 'Sút emiziwshiler', description: 'Mammaliyalar klası', order: 3 },
    ],
  });

  console.log('Seed tabıslı juwmaqlandı!');
}

main().finally(() => prisma.$disconnect());
