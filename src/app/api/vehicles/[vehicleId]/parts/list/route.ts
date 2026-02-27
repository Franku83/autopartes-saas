import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

export async function GET(req: Request, ctx: { params: { vehicleId: string } }) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);
  const vehicleId = ctx.params.vehicleId;

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") ?? "AVAILABLE").trim();

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: vehicleId, organizationId: orgId },
    select: { id: true, make: true, model: true, year: true, engineCode: true, trim: true }
  });

  if (!vehicle) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const items = await prisma.stockItem.findMany({
    where: {
      organizationId: orgId,
      vehicleId,
      status: status as any
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      quantity: true,
      status: true,
      priceUsd: true,
      priceVes: true,
      createdAt: true,
      partModel: {
        select: { sku: true, name: true, category: true }
      },
      location: {
        select: { name: true }
      }
    }
  });

  return NextResponse.json({ vehicle, items }, { status: 200 });
}