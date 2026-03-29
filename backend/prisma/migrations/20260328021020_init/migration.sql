-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "instagramId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "pageId" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL DEFAULT 'Você é um atendente educado e prestativo.',
    "delayMin" INTEGER NOT NULL DEFAULT 3,
    "delayMax" INTEGER NOT NULL DEFAULT 12,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "participantUsername" TEXT,
    "lastMessageAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedLink" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "originalUrl" VARCHAR(2048) NOT NULL,
    "shortCode" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LinkClick" (
    "id" TEXT NOT NULL,
    "trackedLinkId" TEXT NOT NULL,
    "clickedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ip" TEXT,

    CONSTRAINT "LinkClick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_instagramId_key" ON "Account"("instagramId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_pageId_key" ON "Account"("pageId");

-- CreateIndex
CREATE INDEX "Account_pageId_idx" ON "Account"("pageId");

-- CreateIndex
CREATE INDEX "Account_isActive_idx" ON "Account"("isActive");

-- CreateIndex
CREATE INDEX "Account_tokenExpiresAt_idx" ON "Account"("tokenExpiresAt");

-- CreateIndex
CREATE INDEX "Conversation_accountId_idx" ON "Conversation"("accountId");

-- CreateIndex
CREATE INDEX "Conversation_lastMessageAt_idx" ON "Conversation"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_accountId_participantId_key" ON "Conversation"("accountId", "participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_messageId_key" ON "Message"("messageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_sentAt_idx" ON "Message"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedLink_shortCode_key" ON "TrackedLink"("shortCode");

-- CreateIndex
CREATE INDEX "TrackedLink_accountId_idx" ON "TrackedLink"("accountId");

-- CreateIndex
CREATE INDEX "TrackedLink_shortCode_idx" ON "TrackedLink"("shortCode");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedLink_accountId_originalUrl_key" ON "TrackedLink"("accountId", "originalUrl");

-- CreateIndex
CREATE INDEX "LinkClick_trackedLinkId_idx" ON "LinkClick"("trackedLinkId");

-- CreateIndex
CREATE INDEX "LinkClick_clickedAt_idx" ON "LinkClick"("clickedAt");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedLink" ADD CONSTRAINT "TrackedLink_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LinkClick" ADD CONSTRAINT "LinkClick_trackedLinkId_fkey" FOREIGN KEY ("trackedLinkId") REFERENCES "TrackedLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;
