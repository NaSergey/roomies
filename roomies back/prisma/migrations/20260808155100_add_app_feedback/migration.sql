-- CreateEnum
CREATE TYPE "AppFeedbackCategory" AS ENUM ('bug', 'idea', 'other');

-- CreateTable
CREATE TABLE "app_feedback" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "category" "AppFeedbackCategory" NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "screen" VARCHAR(50),
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "app_feedback_handled_created_at_idx" ON "app_feedback"("handled", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "app_feedback" ADD CONSTRAINT "app_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
