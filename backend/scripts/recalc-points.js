// Bir martalik skript: har bir foydalanuvchi ballini faqat test
// natijalaridan (quiz_results.earnedPoints yig'indisi) qayta hisoblaydi.
// Eski kirish/ro'yxatdan o'tish/video bonuslari olib tashlanadi.
// Ishga tushirish: node scripts/recalc-points.js
const prisma = require('../src/utils/prisma');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, points: true },
  });

  for (const user of users) {
    const agg = await prisma.quizResult.aggregate({
      where: { userId: user.id },
      _sum: { earnedPoints: true },
    });
    const quizPoints = agg._sum.earnedPoints || 0;

    if (quizPoints !== user.points) {
      await prisma.user.update({
        where: { id: user.id },
        data: { points: quizPoints },
      });
      console.log(`${user.name}: ${user.points} -> ${quizPoints} ball`);
    } else {
      console.log(`${user.name}: ${user.points} ball (o'zgarmadi)`);
    }
  }

  console.log(`\nJami ${users.length} ta foydalanuvchi qayta hisoblandi.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
