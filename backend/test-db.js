require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
  const materials = await prisma.material.findMany();
  console.log("=== MATERIALS IN DB ===");
  console.log(JSON.stringify(materials, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
