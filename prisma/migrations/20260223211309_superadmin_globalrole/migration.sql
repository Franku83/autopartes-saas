-- CreateEnum
CREATE TYPE "GlobalRole" AS ENUM ('SUPERADMIN', 'USER');

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "joinCodeExpiresAt" TIMESTAMP(3),
ADD COLUMN     "joinCodeHash" TEXT,
ADD COLUMN     "joinCodeMaxUses" INTEGER,
ADD COLUMN     "joinCodeUses" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "globalRole" "GlobalRole" NOT NULL DEFAULT 'USER';

-- CreateTable
CREATE TABLE "OrgAllowedEmail" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roleToAssign" "Role" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT,

    CONSTRAINT "OrgAllowedEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgAllowedEmail_organizationId_idx" ON "OrgAllowedEmail"("organizationId");

-- CreateIndex
CREATE INDEX "OrgAllowedEmail_email_idx" ON "OrgAllowedEmail"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrgAllowedEmail_organizationId_email_key" ON "OrgAllowedEmail"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "OrgAllowedEmail" ADD CONSTRAINT "OrgAllowedEmail_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
