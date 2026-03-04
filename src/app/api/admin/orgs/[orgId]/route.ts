import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

const schema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional()
});

export async function PATCH(req: Request, context: { params: Promise<{ orgId: string }> }) {
  await requireSuperadmin();

  const { orgId } = await context.params;

  if (!orgId || typeof orgId !== "string") {
    return NextResponse.json({ error: "ORG_ID_MISSING" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const exists = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true }
  });

  if (!exists) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.status ? { status: parsed.data.status } : {})
    },
    select: { id: true, name: true, status: true }
  });

  return NextResponse.json({ item: updated }, { status: 200 });
}