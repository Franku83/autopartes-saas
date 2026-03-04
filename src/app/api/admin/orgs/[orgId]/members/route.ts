import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

export async function GET(req: Request, { params }: { params: Promise<{ orgId: string }> }) {
  await requireSuperadmin();

  const { orgId } = await params;

  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "ORG_ID_MISSING" }, { status: 400 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, name: true, status: true, createdAt: true }
  });

  if (!org) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const members = await prisma.membership.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "asc" },
    select: {
      role: true,
      createdAt: true,
      user: { select: { id: true, email: true, name: true, isDisabled: true } }
    }
  });

  return NextResponse.json({ org, members }, { status: 200 });
}