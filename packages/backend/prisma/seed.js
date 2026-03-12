const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Demo kullanıcı oluştur
  const hashedPassword = await bcrypt.hash('demo123', 12);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@nora.ai' },
    update: {},
    create: {
      email: 'demo@nora.ai',
      name: 'Demo Kullanıcı',
      password: hashedPassword,
    },
  });

  console.log(`✅ Demo kullanıcı oluşturuldu: ${demoUser.email}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
