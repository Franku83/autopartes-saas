import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/admin";

const schema = z.object({
  isDisabled: z.boolean()
});

export async function PATCH(req: Request, ctx: { params: { userId: string } }) {
  await requireSuperadmin();

  const userId = ctx.params.userId;

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isDisabled: parsed.data.isDisabled },
    select: { id: true, email: true, isDisabled: true }
  });

  return NextResponse.json({ item: updated }, { status: 200 });
}