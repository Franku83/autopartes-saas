import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { vehicleCreateSchema } from "@/lib/validators";

export async function GET(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim();
  const make = (searchParams.get("make") ?? "").trim();
  const model = (searchParams.get("model") ?? "").trim();
  const year = searchParams.get("year");
  const engineCode = (searchParams.get("engineCode") ?? "").trim();

  const where: any = { organizationId: orgId };

  if (make) where.make = { contains: make, mode: "insensitive" };
  if (model) where.model = { contains: model, mode: "insensitive" };
  if (year) where.year = Number(year) || undefined;
  if (engineCode) where.engineCode = { contains: engineCode, mode: "insensitive" };

  if (q) {
    where.OR = [
      { make: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { engineCode: { contains: q, mode: "insensitive" } },
      { vin: { contains: q, mode: "insensitive" } }
    ];
  }

  const items = await prisma.vehicle.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      trim: true,
      engineCode: true,
      vin: true,
      createdAt: true
    }
  });

  return NextResponse.json({ items }, { status: 200 });
}

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
  const parsed = vehicleCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const created = await prisma.vehicle.create({
    data: {
      organizationId: orgId,
      ...parsed.data,
      createdByUserId: userId
    },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      trim: true,
      engineCode: true,
      vin: true,
      createdAt: true
    }
  });

  return NextResponse.json({ item: created }, { status: 201 });
}