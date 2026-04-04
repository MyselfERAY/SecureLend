-- CreateEnum
CREATE TYPE "chat_room_type" AS ENUM ('CONTRACT', 'SUPPORT');

-- CreateTable
CREATE TABLE "chat_rooms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "chat_room_type" NOT NULL,
    "contract_id" UUID,
    "title" VARCHAR(200),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_room_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_room_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chat_room_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_chat_room_contract" ON "chat_rooms"("contract_id");
CREATE INDEX "idx_chat_room_type" ON "chat_rooms"("type");

-- CreateIndex
CREATE UNIQUE INDEX "uq_chat_participant" ON "chat_room_participants"("chat_room_id", "user_id");
CREATE INDEX "idx_chat_participant_user" ON "chat_room_participants"("user_id");

-- CreateIndex
CREATE INDEX "idx_chat_message_room_date" ON "chat_messages"("chat_room_id", "created_at");
CREATE INDEX "idx_chat_message_sender" ON "chat_messages"("sender_id");
CREATE INDEX "idx_chat_message_unread" ON "chat_messages"("chat_room_id", "is_read");

-- AddForeignKey
ALTER TABLE "chat_rooms" ADD CONSTRAINT "chat_rooms_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_room_participants" ADD CONSTRAINT "chat_room_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chat_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
