import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

export async function GET(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {
    organizationId: orgId,
    status: { in: ["AVAILABLE", "RESERVED"] },
    quantity: { gt: 0 }
  };

  if (q) {
    where.OR = [
      { partModel: { sku: { contains: q, mode: "insensitive" } } },
      { partModel: { name: { contains: q, mode: "insensitive" } } },
      { partModel: { category: { contains: q, mode: "insensitive" } } },
      { vehicle: { make: { contains: q, mode: "insensitive" } } },
      { vehicle: { model: { contains: q, mode: "insensitive" } } },
      { vehicle: { engineCode: { contains: q, mode: "insensitive" } } }
    ];
  }

  const items = await prisma.stockItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      quantity: true,
      status: true,
      priceUsd: true,
      partModel: { select: { sku: true, name: true, category: true } },
      vehicle: { select: { make: true, model: true, year: true, engineCode: true } },
      location: { select: { name: true } }
    }
  });

  return NextResponse.json({ items }, { status: 200 });
}