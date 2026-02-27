import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

const schema = z.object({
  status: z.enum(["AVAILABLE", "RESERVED", "SOLD", "DISCARDED"]).optional(),
  quantity: z.coerce.number().int().min(1).max(100000).optional(),
  priceUsd: z.coerce.number().min(0).optional(),
  locationName: z.string().min(1).max(60).optional(),
  notes: z.string().max(500).optional()
});

export async function PATCH(req: Request, ctx: { params: { stockItemId: string } }) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);
  const stockItemId = ctx.params.stockItemId;

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "STAFF")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const existing = await prisma.stockItem.findFirst({
    where: { id: stockItemId, organizationId: orgId },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const input = parsed.data;

  let locationId: string | null | undefined = undefined;

  if (input.locationName) {
    const name = input.locationName.trim();

    const loc = await prisma.location.findFirst({
      where: { organizationId: orgId, name },
      select: { id: true }
    });

    if (loc) locationId = loc.id;
    else {
      const created = await prisma.location.create({ data: { organizationId: orgId, name } });
      locationId = created.id;
    }
  }

  const updated = await prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(typeof input.quantity === "number" ? { quantity: input.quantity } : {}),
      ...(typeof input.priceUsd === "number" ? { priceUsd: String(input.priceUsd) } : {}),
      ...(locationId !== undefined ? { locationId } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {})
    },
    select: {
      id: true,
      status: true,
      quantity: true,
      priceUsd: true,
      location: { select: { name: true } }
    }
  });

  return NextResponse.json({ item: updated }, { status: 200 });
}