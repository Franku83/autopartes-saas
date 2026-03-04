import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

export async function GET(req: Request) {
  await requireSuperadmin();

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const orgs = await prisma.organization.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      memberships: {
        where: { role: "OWNER" },
        select: { user: { select: { email: true } } }
      }
    }
  });

  const orgIds = orgs.map((o) => o.id);

  const memberCounts = await prisma.membership.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: orgIds } },
    _count: { id: true }
  });

  const sales30 = await prisma.sale.groupBy({
    by: ["organizationId"],
    where: { organizationId: { in: orgIds }, createdAt: { gte: d30 } },
    _sum: { totalUsd: true },
    _count: { id: true }
  });

  const mapMembers = new Map(memberCounts.map((m) => [m.organizationId, m._count.id]));
  const mapSales30 = new Map(
    sales30.map((s) => [
      s.organizationId,
      { count: s._count.id, totalUsd: Number(s._sum.totalUsd ?? 0) }
    ])
  );

  const items = orgs.map((o) => ({
    id: o.id,
    name: o.name,
    status: o.status,
    createdAt: o.createdAt,
    owners: o.memberships.map((m) => m.user.email),
    members: mapMembers.get(o.id) ?? 0,
    sales30d: mapSales30.get(o.id) ?? { count: 0, totalUsd: 0 }
  }));

  return NextResponse.json({ items }, { status: 200 });
}