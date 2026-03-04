import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || membership.role !== "OWNER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, slug: true }
  });

  if (!org) {
    return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 404 });
  }

  if (org.slug) {
    return NextResponse.json({ slug: org.slug }, { status: 200 });
  }

  let baseSlug = slugify(org.name);
  let finalSlug = baseSlug;
  let counter = 1;

  // Ensure uniqueness
  while (true) {
    const existing = await prisma.organization.findUnique({
      where: { slug: finalSlug },
      select: { id: true }
    });

    if (!existing) break;
    
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { slug: finalSlug },
    select: { slug: true }
  });

  return NextResponse.json({ slug: updated.slug }, { status: 201 });
}
