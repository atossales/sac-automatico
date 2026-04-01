-- CreateEnum
CREATE TYPE "AutomationType" AS ENUM ('WELCOME', 'KEYWORD', 'STORY_MENTION');

-- CreateTable
CREATE TABLE "Automation" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" "AutomationType" NOT NULL,
    "triggerValue" TEXT,
    "message" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Automation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Automation_accountId_idx" ON "Automation"("accountId");

-- CreateIndex
CREATE INDEX "Automation_type_isActive_idx" ON "Automation"("type", "isActive");

-- AddForeignKey
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
