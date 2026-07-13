require('dotenv').config();
const prisma = require('../src/utils/prisma');

(async () => {
  let subject = await prisma.subject.findUnique({ where: { slug: 'zoologiya' } });
  if (!subject) {
    subject = await prisma.subject.create({
      data: { name: 'Zoologiya', slug: 'zoologiya', description: "Hayvonot dunyosini o'rganuvchi fan", order: 0 },
    });
    console.log('Created subject:', subject.name);
  } else {
    console.log('Subject already exists:', subject.name);
  }
  const res = await prisma.category.updateMany({ where: { subjectId: null }, data: { subjectId: subject.id } });
  console.log(`Attached ${res.count} categories to Zoologiya`);
  const subjects = await prisma.subject.findMany({ include: { _count: { select: { categories: true } } } });
  console.log('Subjects now:', JSON.stringify(subjects.map(s => ({ name: s.name, categories: s._count.categories })), null, 2));
  await prisma.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
