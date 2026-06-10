-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('looking_housing_roomie', 'has_housing_seeking_roomie', 'looking_roomie_find_housing', 'squad');

-- CreateEnum
CREATE TYPE "GuestsPreference" AS ENUM ('rarely', 'sometimes', 'often');

-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('like', 'super_like', 'save', 'pass');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'voice', 'system', 'call_invite');

-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('phone', 'selfie', 'student_email');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('spam', 'fake', 'abuse', 'suspicious', 'other');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'reviewed', 'resolved');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('draft', 'accepted', 'declined');

-- CreateEnum
CREATE TYPE "SquadRole" AS ENUM ('leader', 'member');

-- CreateEnum
CREATE TYPE "SquadInviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired');

-- CreateTable
CREATE TABLE "cities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "country_code" CHAR(2) NOT NULL DEFAULT 'RU',

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" SERIAL NOT NULL,
    "city_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegram_id" BIGINT NOT NULL,
    "telegram_username" VARCHAR(64),
    "telegram_photo_url" TEXT,
    "language_code" VARCHAR(10),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "name" VARCHAR(100) NOT NULL,
    "birth_date" DATE,
    "scenario" "ScenarioType" NOT NULL,
    "city_id" INTEGER,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "move_in_date" DATE,
    "stay_duration_months" INTEGER,
    "smoking_ok" BOOLEAN NOT NULL DEFAULT false,
    "pets_ok" BOOLEAN NOT NULL DEFAULT false,
    "guests_pref" "GuestsPreference" NOT NULL DEFAULT 'sometimes',
    "noise_level" DECIMAL(3,2),
    "cleanliness" DECIMAL(3,2),
    "sleep_schedule" DECIMAL(3,2),
    "social_level" DECIMAL(3,2),
    "work_from_home" DECIMAL(3,2),
    "roomie_score" INTEGER NOT NULL DEFAULT 0,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_selfie_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_student_verified" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" SMALLINT NOT NULL DEFAULT 0,
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "quiz_completed" BOOLEAN NOT NULL DEFAULT false,
    "boosted_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_photos" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "display_order" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_tags" (
    "id" SERIAL NOT NULL,
    "label" VARCHAR(50) NOT NULL,

    CONSTRAINT "vibe_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_vibe_tags" (
    "user_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "user_vibe_tags_pkey" PRIMARY KEY ("user_id","tag_id")
);

-- CreateTable
CREATE TABLE "user_districts" (
    "user_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,

    CONSTRAINT "user_districts_pkey" PRIMARY KEY ("user_id","district_id")
);

-- CreateTable
CREATE TABLE "quiz_questions" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "question_text" VARCHAR(255) NOT NULL,
    "options" JSONB NOT NULL,
    "display_order" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "quiz_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_quiz_answers" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "option_code" VARCHAR(50) NOT NULL,
    "answer_value" DECIMAL(3,2) NOT NULL,
    "answered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quiz_answers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vibe_embeddings" (
    "user_id" INTEGER NOT NULL,
    "vector" DOUBLE PRECISION[],
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vibe_embeddings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "id" SERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "user1_id" INTEGER NOT NULL,
    "user2_id" INTEGER NOT NULL,
    "match_score" DECIMAL(5,4) NOT NULL,
    "hard_score" DECIMAL(5,4),
    "lifestyle_score" DECIMAL(5,4),
    "vibe_score" DECIMAL(5,4),
    "behavioral_score" DECIMAL(5,4),
    "match_reasons" JSONB,
    "match_risks" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" BIGSERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" TEXT,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "edited_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_reads" (
    "chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "last_read_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_reads_pkey" PRIMARY KEY ("chat_id","user_id")
);

-- CreateTable
CREATE TABLE "call_invites" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "proposer_id" INTEGER NOT NULL,
    "proposed_times" JSONB NOT NULL,
    "confirmed_time" TIMESTAMP(3),
    "status" "CallStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roomie_agreements" (
    "id" SERIAL NOT NULL,
    "chat_id" INTEGER NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'draft',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),

    CONSTRAINT "roomie_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreement_items" (
    "id" SERIAL NOT NULL,
    "agreement_id" INTEGER NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "rule_text" TEXT NOT NULL,
    "agreed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "agreement_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squads" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100),
    "city_id" INTEGER,
    "budget_min" INTEGER,
    "budget_max" INTEGER,
    "max_members" SMALLINT NOT NULL DEFAULT 4,
    "created_by" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "squad_members" (
    "squad_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "SquadRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "squad_members_pkey" PRIMARY KEY ("squad_id","user_id")
);

-- CreateTable
CREATE TABLE "squad_districts" (
    "squad_id" INTEGER NOT NULL,
    "district_id" INTEGER NOT NULL,

    CONSTRAINT "squad_districts_pkey" PRIMARY KEY ("squad_id","district_id")
);

-- CreateTable
CREATE TABLE "squad_invites" (
    "id" SERIAL NOT NULL,
    "squad_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "status" "SquadInviteStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "squad_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "behavioral_events" (
    "id" BIGSERIAL NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_id" INTEGER NOT NULL,
    "event_type" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "behavioral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_match_feedback" (
    "id" SERIAL NOT NULL,
    "match_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "vibe_matched" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_match_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'pending',
    "external_ref" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" INTEGER NOT NULL,
    "reported_id" INTEGER NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "blocker_id" INTEGER NOT NULL,
    "blocked_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("blocker_id","blocked_id")
);

-- CreateTable
CREATE TABLE "boosts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_type" VARCHAR(50) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'RUB',
    "store" VARCHAR(20) NOT NULL,
    "store_tx_id" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "platform" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "user_id" INTEGER NOT NULL,
    "new_match" BOOLEAN NOT NULL DEFAULT true,
    "new_message" BOOLEAN NOT NULL DEFAULT true,
    "call_reminder" BOOLEAN NOT NULL DEFAULT true,
    "nearby_people" BOOLEAN NOT NULL DEFAULT true,
    "marketing" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "districts_city_id_idx" ON "districts"("city_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_telegram_id_key" ON "users"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_city_id_idx" ON "users"("city_id");

-- CreateIndex
CREATE INDEX "users_scenario_idx" ON "users"("scenario");

-- CreateIndex
CREATE INDEX "users_budget_min_budget_max_idx" ON "users"("budget_min", "budget_max");

-- CreateIndex
CREATE INDEX "users_move_in_date_idx" ON "users"("move_in_date");

-- CreateIndex
CREATE INDEX "users_is_active_last_seen_at_idx" ON "users"("is_active", "last_seen_at" DESC);

-- CreateIndex
CREATE INDEX "users_smoking_ok_pets_ok_guests_pref_idx" ON "users"("smoking_ok", "pets_ok", "guests_pref");

-- CreateIndex
CREATE UNIQUE INDEX "vibe_tags_label_key" ON "vibe_tags"("label");

-- CreateIndex
CREATE INDEX "user_districts_district_id_idx" ON "user_districts"("district_id");

-- CreateIndex
CREATE INDEX "user_quiz_answers_user_id_idx" ON "user_quiz_answers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_quiz_answers_user_id_question_id_key" ON "user_quiz_answers"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "swipes_actor_id_created_at_idx" ON "swipes"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "swipes_target_id_action_idx" ON "swipes"("target_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_actor_id_target_id_key" ON "swipes"("actor_id", "target_id");

-- CreateIndex
CREATE INDEX "matches_user1_id_match_score_idx" ON "matches"("user1_id", "match_score" DESC);

-- CreateIndex
CREATE INDEX "matches_user2_id_match_score_idx" ON "matches"("user2_id", "match_score" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "matches_user1_id_user2_id_key" ON "matches"("user1_id", "user2_id");

-- CreateIndex
CREATE UNIQUE INDEX "chats_match_id_key" ON "chats"("match_id");

-- CreateIndex
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages"("chat_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "squad_members_user_id_idx" ON "squad_members"("user_id");

-- CreateIndex
CREATE INDEX "squad_invites_recipient_id_status_idx" ON "squad_invites"("recipient_id", "status");

-- CreateIndex
CREATE INDEX "squad_invites_squad_id_status_idx" ON "squad_invites"("squad_id", "status");

-- CreateIndex
CREATE INDEX "behavioral_events_actor_id_created_at_idx" ON "behavioral_events"("actor_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "behavioral_events_target_id_event_type_idx" ON "behavioral_events"("target_id", "event_type");

-- CreateIndex
CREATE UNIQUE INDEX "post_match_feedback_match_id_user_id_key" ON "post_match_feedback"("match_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verifications_user_id_type_key" ON "verifications"("user_id", "type");

-- CreateIndex
CREATE INDEX "reports_reported_id_status_idx" ON "reports"("reported_id", "status");

-- CreateIndex
CREATE INDEX "blocks_blocked_id_idx" ON "blocks"("blocked_id");

-- CreateIndex
CREATE INDEX "boosts_user_id_expires_at_idx" ON "boosts"("user_id", "expires_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "purchases_store_tx_id_key" ON "purchases"("store_tx_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_user_id_idx" ON "push_tokens"("user_id");

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vibe_tags" ADD CONSTRAINT "user_vibe_tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_vibe_tags" ADD CONSTRAINT "user_vibe_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "vibe_tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_districts" ADD CONSTRAINT "user_districts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_districts" ADD CONSTRAINT "user_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_answers" ADD CONSTRAINT "user_quiz_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_quiz_answers" ADD CONSTRAINT "user_quiz_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "quiz_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vibe_embeddings" ADD CONSTRAINT "vibe_embeddings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_reads" ADD CONSTRAINT "chat_reads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_invites" ADD CONSTRAINT "call_invites_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_invites" ADD CONSTRAINT "call_invites_proposer_id_fkey" FOREIGN KEY ("proposer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomie_agreements" ADD CONSTRAINT "roomie_agreements_chat_id_fkey" FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roomie_agreements" ADD CONSTRAINT "roomie_agreements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreement_items" ADD CONSTRAINT "agreement_items_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "roomie_agreements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squads" ADD CONSTRAINT "squads_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_members" ADD CONSTRAINT "squad_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_districts" ADD CONSTRAINT "squad_districts_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_districts" ADD CONSTRAINT "squad_districts_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_invites" ADD CONSTRAINT "squad_invites_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "squads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_invites" ADD CONSTRAINT "squad_invites_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "squad_invites" ADD CONSTRAINT "squad_invites_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_events" ADD CONSTRAINT "behavioral_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "behavioral_events" ADD CONSTRAINT "behavioral_events_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_match_feedback" ADD CONSTRAINT "post_match_feedback_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_match_feedback" ADD CONSTRAINT "post_match_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boosts" ADD CONSTRAINT "boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
