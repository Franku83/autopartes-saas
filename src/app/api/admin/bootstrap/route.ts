import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { z } from "zod";

const schema = z.object({
  key: z.string().min(10)
});

export async function POST(req: Request) {
  const { userId } = await requireUser();

  const data = await req.json().catch(() => null);
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const key = parsed.data.key;
  const envKey = process.env.BOOTSTRAP_KEY;

  if (!envKey || key !== envKey) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const superadmins = await prisma.user.count({
    where: { globalRole: "SUPERADMIN" }
  });

  if (superadmins > 0) {
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { globalRole: true }
    });

    if (me?.globalRole !== "SUPERADMIN") {
      return NextResponse.json({ error: "ALREADY_BOOTSTRAPPED" }, { status: 403 });
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { globalRole: "SUPERADMIN" }
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}