import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

const schema = z.object({
  sku: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  compatibility: z.string().max(500).optional(),
  quantity: z.coerce.number().int().min(1).max(1000),
  priceUsd: z.coerce.number().min(0),
  locationName: z.string().max(60).optional(),
  notes: z.string().max(500).optional()
});

export async function POST(req: Request, { params }: { params: Promise<{ vehicleId: string }> }) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);
  const { vehicleId } = await params;

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "STAFF")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: orgId },
    select: { id: true }
  });

  if (!vehicle) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const input = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    let locationId: string | null = null;

    if (input.locationName && input.locationName.trim()) {
      const name = input.locationName.trim();

      const existing = await tx.location.findFirst({
        where: { organizationId: orgId, name },
        select: { id: true }
      });

      if (existing) locationId = existing.id;
      else {
        const created = await tx.location.create({
          data: { organizationId: orgId, name }
        });
        locationId = created.id;
      }
    }

    const sku = input.sku.trim();
    const partModel = await tx.partModel.upsert({
      where: { organizationId_sku: { organizationId: orgId, sku } },
      create: {
        organizationId: orgId,
        sku,
        name: input.name.trim(),
        category: input.category.trim(),
        compatibility: input.compatibility?.trim() || null,
        createdByUserId: userId
      },
      update: {
        name: input.name.trim(),
        category: input.category.trim(),
        compatibility: input.compatibility?.trim() || null
      },
      select: { id: true }
    });

    const stockItem = await tx.stockItem.create({
      data: {
        organizationId: orgId,
        partModelId: partModel.id,
        vehicleId,
        locationId,
        quantity: input.quantity,
        status: "AVAILABLE",
        priceUsd: input.priceUsd,
        priceVes: null,
        notes: input.notes?.trim() || null,
        createdByUserId: userId
      },
      select: { id: true }
    });

    return { stockItemId: stockItem.id };
  });

  return NextResponse.json(result, { status: 201 });
}