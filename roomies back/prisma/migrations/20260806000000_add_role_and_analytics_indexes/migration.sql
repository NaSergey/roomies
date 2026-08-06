-- CreateEnum
CREATE TYPE "Role" AS ENUM ('user', 'admin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'user';

-- CreateIndex (CRM-аналитика: тайм-серии по дате регистрации/мэтча/сообщения/свайпа)
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

CREATE INDEX "swipes_created_at_idx" ON "swipes"("created_at");

CREATE INDEX "matches_created_at_idx" ON "matches"("created_at");

CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");
