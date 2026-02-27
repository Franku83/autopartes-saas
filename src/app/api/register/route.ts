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
  organizationId: z.string().min(1).optional()
});

export async function POST(req: Request) {
  const data = await req.json();
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { name, email, password } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const joinCode = (parsed.data.joinCode ?? "").trim();
  const orgIdHint = (parsed.data.organizationId ?? "").trim();

  let organizationId: string | null = null;
  let roleToAssign: "OWNER" | "STAFF" | "VIEWER" = "STAFF";

  if (joinCode) {
    const codeHash = hashJoinCode(joinCode);

    const org = await prisma.organization.findFirst({
      where: {
        joinCodeHash: codeHash,
        OR: [
          { joinCodeExpiresAt: null },
          { joinCodeExpiresAt: { gt: new Date() } }
        ]
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
        create: {
          organizationId,
          role: roleToAssign
        }
      }
    },
    select: { id: true, email: true }
  });

  return NextResponse.json({ userId: user.id, organizationId }, { status: 201 });
}