import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["OWNER", "STAFF", "VIEWER"])
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ orgId: string; userId: string }> }
) {
  await requireSuperadmin();
  const { orgId, userId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } }
  });

  if (!membership) {
    return NextResponse.json({ error: "MEMBERSHIP_NOT_FOUND" }, { status: 404 });
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: { role: parsed.data.role }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
