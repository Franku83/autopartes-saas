import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

export async function GET(req: Request) {
  console.log("API Stats llamada");
  await requireSuperadmin();

  const [totalOrgs, activeUsers, totalSales] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count({ where: { isDisabled: false } }),
    prisma.sale.aggregate({ _sum: { totalUsd: true } })
  ]);

  return NextResponse.json({
    totalOrgs,
    activeUsers,
    totalSalesUsd: Number(totalSales._sum.totalUsd ?? 0)
  });
}
