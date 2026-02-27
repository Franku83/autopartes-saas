import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { ensureExchangeRate } from "@/lib/exchange-rate";

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