import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { generateJoinCode, hashJoinCode } from "@/lib/join-code";

export async function POST() {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const code = generateJoinCode();
  const codeHash = hashJoinCode(code);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      joinCodeHash: codeHash,
      joinCodeUses: 0,
      joinCodeMaxUses: null,
      joinCodeExpiresAt: null
    }
  });

  return NextResponse.json({ joinCode: code }, { status: 200 });
}