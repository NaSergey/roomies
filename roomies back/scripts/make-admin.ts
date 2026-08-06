// Выдаёт роль admin (доступ к CRM /admin/analytics/**) существующему пользователю.
// Намеренно НЕ HTTP-эндпоинт — только прямой доступ к БД, чтобы стать админом
// нельзя было через API ни при каких условиях.
//
// Запуск:
//   npm run make:admin -- user@example.com
//   npm run make:admin -- 123456789012345    (telegramId)
//
// Чтобы отозвать роль — тот же скрипт с --revoke:
//   npm run make:admin -- user@example.com --revoke
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env['DATABASE_URL']!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes('--revoke');
  const identifier = args.find((a) => !a.startsWith('--'));

  if (!identifier) {
    console.error(
      'Использование: npm run make:admin -- <email|telegramId> [--revoke]',
    );
    process.exit(1);
  }

  const isTelegramId = /^\d+$/.test(identifier);
  const where = isTelegramId
    ? { telegramId: BigInt(identifier) }
    : { email: identifier.toLowerCase() };

  const user = await prisma.user.findUnique({
    where,
    select: { id: true, name: true, role: true },
  });
  if (!user) {
    console.error(`Пользователь не найден: ${identifier}`);
    process.exit(1);
  }

  const role = revoke ? 'user' : 'admin';
  if (user.role === role) {
    console.log(
      `У «${user.name}» (id=${user.id}) уже role=${role} — ничего не меняю.`,
    );
    return;
  }

  await prisma.user.update({ where: { id: user.id }, data: { role } });
  console.log(`Готово: «${user.name}» (id=${user.id}) теперь role=${role}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
