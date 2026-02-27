import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

const schema = z.object({
  organizationId: z.string().min(1),
  email: z.string().email()
});

export async function POST(req: Request) {
  await requireSuperadmin();

  const data = await req.json().catch(() => null);
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const organizationId = parsed.data.organizationId;
  const email = parsed.data.email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  await prisma.membership.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId } },
    create: { userId: user.id, organizationId, role: "OWNER" },
    update: { role: "OWNER" }
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastOrganizationId: organizationId }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}