const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { username: 'admin' },
    data: { password: '$2a$10$ce69hcSKRVDoGecQd69TcOlIZeKCSp/wMt/t3Y1l7oL5miYbU83zK' }
  });
  console.log("Updated admin password");
}

main().finally(() => prisma.$disconnect());
