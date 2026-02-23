import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  orgName: z.string().min(2).max(80),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const data = await req.json();
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { orgName, name, email, password } = parsed.data;
  const emailNorm = email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (exists) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: orgName.trim(),
        locations: {
          create: [{ name: "Principal" }],
        },
      },
      include: { locations: true },
    });

    const user = await tx.user.create({
      data: {
        email: emailNorm,
        name: name.trim(),
        passwordHash,
        lastOrganizationId: organization.id,
        memberships: {
          create: {
            organizationId: organization.id,
            role: "OWNER",
          },
        },
      },
    });

    return { userId: user.id, organizationId: organization.id };
  });

  return NextResponse.json(result, { status: 201 });
}