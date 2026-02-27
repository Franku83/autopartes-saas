import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function requireSuperadmin() {
  const { userId } = await requireUser();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true }
  });

  if (!user || user.globalRole !== "SUPERADMIN") {
    throw new Error("FORBIDDEN");
  }

  return { userId };
}