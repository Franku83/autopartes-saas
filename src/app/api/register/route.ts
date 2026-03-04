import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashJoinCode } from "@/lib/join-code";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  joinCode: z.string().min(1).optional(),
  organizationId: z.string().min(1).optional(),
  accountType: z.enum(["OWNER", "EMPLOYEE"]).optional(),
  orgName: z.string().min(2).max(80).optional()
});

export async function POST(req: Request) {
  const data = await req.json().catch(() => null);
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (exists) {
    return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const accountType = parsed.data.accountType ?? "EMPLOYEE";

  if (accountType === "OWNER") {
    const orgName = (parsed.data.orgName ?? "").trim();
    if (!orgName) {
      return NextResponse.json({ error: "ORG_NAME_REQUIRED" }, { status: 400 });
    }

    const pre = await prisma.orgOwnerPreapproval.findFirst({
      where: { email: emailNorm, usedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, organizationId: true }
    });

    if (!pre) {
      return NextResponse.json({ error: "OWNER_NOT_APPROVED" }, { status: 403 });
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: pre.organizationId },
        data: { name: orgName }
      });

      const user = await tx.user.create({
        data: {
          email: emailNorm,
          name: name.trim(),
          passwordHash,
          lastOrganizationId: pre.organizationId,
          memberships: {
            create: { organizationId: pre.organizationId, role: "OWNER" }
          }
        },
        select: { id: true }
      });

      await tx.orgOwnerPreapproval.update({
        where: { id: pre.id },
        data: { usedAt: new Date() }
      });

      return { userId: user.id, organizationId: pre.organizationId };
    });

    return NextResponse.json(result, { status: 201 });
  }

  const joinCode = (parsed.data.joinCode ?? "").trim();
  const orgIdHint = (parsed.data.organizationId ?? "").trim();

  let organizationId: string | null = null;
  let roleToAssign: "OWNER" | "STAFF" | "VIEWER" = "STAFF";

  if (joinCode) {
    const codeHash = hashJoinCode(joinCode);

    const org = await prisma.organization.findFirst({
      where: {
        joinCodeHash: codeHash,
        OR: [{ joinCodeExpiresAt: null }, { joinCodeExpiresAt: { gt: new Date() } }]
      },
      select: { id: true, joinCodeUses: true, joinCodeMaxUses: true }
    });

    if (!org) {
      return NextResponse.json({ error: "INVALID_JOIN_CODE" }, { status: 403 });
    }

    if (org.joinCodeMaxUses !== null && org.joinCodeUses >= org.joinCodeMaxUses) {
      return NextResponse.json({ error: "JOIN_CODE_EXHAUSTED" }, { status: 403 });
    }

    organizationId = org.id;
    roleToAssign = "STAFF";

    await prisma.organization.update({
      where: { id: org.id },
      data: { joinCodeUses: { increment: 1 } }
    });
  } else {
    const allowed = await prisma.orgAllowedEmail.findFirst({
      where: {
        email: emailNorm,
        ...(orgIdHint ? { organizationId: orgIdHint } : {})
      },
      select: { organizationId: true, roleToAssign: true }
    });

    if (!allowed) {
      return NextResponse.json({ error: "NOT_ALLOWED" }, { status: 403 });
    }

    organizationId = allowed.organizationId;
    roleToAssign = allowed.roleToAssign;
  }

  const user = await prisma.user.create({
    data: {
      email: emailNorm,
      name: name.trim(),
      passwordHash,
      lastOrganizationId: organizationId,
      memberships: {
        create: { organizationId, role: roleToAssign }
      }
    },
    select: { id: true }
  });

  return NextResponse.json({ userId: user.id, organizationId }, { status: 201 });
}