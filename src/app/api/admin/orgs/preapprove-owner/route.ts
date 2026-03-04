import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

const schema = z.object({
  email: z.string().email()
});

export async function POST(req: Request) {
  await requireSuperadmin();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: `Pendiente - ${email}`,
        locations: {
          create: [{ name: "Principal" }]
        }
      },
      select: { id: true, name: true }
    });

    const pre = await tx.orgOwnerPreapproval.create({
      data: {
        organizationId: org.id,
        email
      },
      select: { id: true, organizationId: true, email: true, createdAt: true }
    });

    return { org, pre };
  });

  return NextResponse.json(result, { status: 201 });
}