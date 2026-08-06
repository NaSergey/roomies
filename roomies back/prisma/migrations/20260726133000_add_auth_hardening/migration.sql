-- Непрозрачный идентификатор аккаунта: попадает в `sub` JWT вместо автоинкрементного id.
-- Добавляем в три шага (nullable -> backfill -> NOT NULL), чтобы не ломать существующие строки.
-- gen_random_uuid() встроен в PostgreSQL 13+, расширение pgcrypto не требуется.
ALTER TABLE "users" ADD COLUMN "public_id" TEXT;
UPDATE "users" SET "public_id" = gen_random_uuid()::text WHERE "public_id" IS NULL;
ALTER TABLE "users" ALTER COLUMN "public_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- Эпоха выданных токенов: инкремент обесценивает все ранее выданные JWT пользователя.
ALTER TABLE "users" ADD COLUMN "token_version" INTEGER NOT NULL DEFAULT 0;
