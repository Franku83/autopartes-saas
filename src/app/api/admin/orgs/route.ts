import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

export async function GET() {
  await requireSuperadmin();

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      memberships: {
        where: { role: "OWNER" },
        select: {
          user: { select: { id: true, email: true, name: true } }
        }
      }
    }
  });

  return NextResponse.json({ orgs }, { status: 200 });
}