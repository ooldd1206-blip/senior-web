-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userA" TEXT NOT NULL,
    "userB" TEXT NOT NULL,
    "source" "ChatSource",
    "lastMessage" TEXT,
    "lastTime" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Chat_userA_userB_key" ON "Chat"("userA", "userB");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userA_fkey" FOREIGN KEY ("userA") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userB_fkey" FOREIGN KEY ("userB") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
