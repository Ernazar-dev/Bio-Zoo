const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

let connectionString = process.env.DATABASE_URL || '';
if (connectionString.includes('sslmode=require') || connectionString.includes('sslmode=prefer') || connectionString.includes('sslmode=verify-ca')) {
  connectionString = connectionString.replace(/sslmode=(prefer|require|verify-ca)/g, 'sslmode=verify-full');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
module.exports = prisma;

