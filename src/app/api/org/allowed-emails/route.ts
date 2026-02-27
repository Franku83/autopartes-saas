import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

const postSchema = z.object({
  email: z.string().email(),
  roleToAssign: z.enum(["OWNER", "STAFF", "VIEWER"]).optional()
});

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

  const items = await prisma.orgAllowedEmail.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, roleToAssign: true, createdAt: true }
  });

  return NextResponse.json({ items }, { status: 200 });
}

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const data = await req.json();
  const parsed = postSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const roleToAssign = parsed.data.roleToAssign ?? "STAFF";

  const created = await prisma.orgAllowedEmail.create({
    data: {
      organizationId: orgId,
      email,
      roleToAssign,
      createdByUserId: userId
    },
    select: { id: true, email: true, roleToAssign: true, createdAt: true }
  });

  return NextResponse.json({ item: created }, { status: 201 });
}