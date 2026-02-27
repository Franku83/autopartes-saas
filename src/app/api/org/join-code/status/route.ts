import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

export async function GET() {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      joinCodeHash: true,
      joinCodeUses: true,
      joinCodeMaxUses: true,
      joinCodeExpiresAt: true
    }
  });

  return NextResponse.json(
    {
      hasActiveCode: Boolean(org?.joinCodeHash),
      uses: org?.joinCodeUses ?? 0,
      maxUses: org?.joinCodeMaxUses ?? null,
      expiresAt: org?.joinCodeExpiresAt ?? null
    },
    { status: 200 }
  );
}