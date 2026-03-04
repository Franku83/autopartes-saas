import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { ensureExchangeRate } from "@/lib/exchange-rate";

const createSchema = z.object({
  sku: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(60),
  compatibility: z.string().max(500).optional(),
  quantity: z.coerce.number().int().min(1).max(1000),
  priceUsd: z.coerce.number().min(0),
  locationName: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
  vehicleId: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "STAFF")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID", details: parsed.error.format() }, { status: 400 });
  }

  const input = parsed.data;

  // Validate vehicle if provided
  if (input.vehicleId) {
    const v = await prisma.vehicle.findFirst({
      where: { id: input.vehicleId, organizationId: orgId },
      select: { id: true }
    });
    if (!v) return NextResponse.json({ error: "VEHICLE_NOT_FOUND" }, { status: 404 });
  }

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
        vehicleId: input.vehicleId || null,
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

export async function GET(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const status = (searchParams.get("status") ?? "AVAILABLE").trim();
  const category = (searchParams.get("category") ?? "").trim();
  const vehicleId = (searchParams.get("vehicleId") ?? "").trim();
  const location = (searchParams.get("location") ?? "").trim();

  const minUsd = (searchParams.get("minUsd") ?? "").trim();
  const maxUsd = (searchParams.get("maxUsd") ?? "").trim();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get("pageSize") ?? "20") || 20));
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId: orgId };

  if (status) where.status = status;
  if (category) where.partModel = { category: { equals: category, mode: "insensitive" } };
  if (vehicleId) where.vehicleId = vehicleId;
  if (location) where.location = { name: { contains: location, mode: "insensitive" } };

  if (minUsd || maxUsd) {
    where.priceUsd = {};
    if (minUsd) where.priceUsd.gte = minUsd;
    if (maxUsd) where.priceUsd.lte = maxUsd;
  }

  if (q) {
    where.OR = [
      { partModel: { sku: { contains: q, mode: "insensitive" } } },
      { partModel: { name: { contains: q, mode: "insensitive" } } },
      { partModel: { category: { contains: q, mode: "insensitive" } } },
      { vehicle: { make: { contains: q, mode: "insensitive" } } },
      { vehicle: { model: { contains: q, mode: "insensitive" } } },
      { vehicle: { engineCode: { contains: q, mode: "insensitive" } } },
      { location: { name: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [total, items, rate] = await Promise.all([
    prisma.stockItem.count({ where }),
    prisma.stockItem.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        quantity: true,
        status: true,
        priceUsd: true,
        createdAt: true,
        partModel: { select: { sku: true, name: true, category: true } },
        vehicle: { select: { id: true, make: true, model: true, year: true, engineCode: true } },
        location: { select: { name: true } }
      }
    }),
    ensureExchangeRate(orgId, 12)
  ]);

  return NextResponse.json(
    {
      page,
      pageSize,
      total,
      rateVesPerUsd: rate.rateVesPerUsd,
      rateEffectiveAt: rate.effectiveAt,
      items
    },
    { status: 200 }
  );
}