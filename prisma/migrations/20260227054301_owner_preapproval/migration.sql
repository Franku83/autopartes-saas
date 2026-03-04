-- CreateTable
CREATE TABLE "OrgOwnerPreapproval" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "OrgOwnerPreapproval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrgOwnerPreapproval_email_idx" ON "OrgOwnerPreapproval"("email");

-- CreateIndex
CREATE INDEX "OrgOwnerPreapproval_organizationId_idx" ON "OrgOwnerPreapproval"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgOwnerPreapproval_organizationId_email_key" ON "OrgOwnerPreapproval"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "OrgOwnerPreapproval" ADD CONSTRAINT "OrgOwnerPreapproval_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
