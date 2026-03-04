import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { hashJoinCode } from "@/lib/join-code";
import { slugify } from "@/lib/utils";

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

  // TEMPORAL: Bypass whitelist/preapproval for initial admin setup
  if (accountType === "OWNER") {
    const orgName = (parsed.data.orgName ?? "Mi Negocio").trim();
    
    const result = await prisma.$transaction(async (tx) => {
      // Create a brand new organization directly
      const org = await tx.organization.create({
        data: { 
          name: orgName,
          slug: slugify(orgName) || `org-${Date.now()}`
        }
      });

      const user = await tx.user.create({
        data: {
          email: emailNorm,
          name: name.trim(),
          passwordHash,
          lastOrganizationId: org.id,
          memberships: {
            create: { organizationId: org.id, role: "OWNER" }
          }
        },
        select: { id: true }
      });

      return { userId: user.id, organizationId: org.id };
    });

    return NextResponse.json(result, { status: 201 });
  }

  // For EMPLOYEE, we still need an orgId. If none provided, we can't register without joinCode or whitelist
  // unless we're in "bypass" mode. But usually the first account is an OWNER.
  
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
      // TEMPORAL BYPASS for initial setup: if no join code and no whitelist, we still block 
      // but the user should use OWNER type for the first account.
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
