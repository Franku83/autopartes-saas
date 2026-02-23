import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  return { userId };
}

export async function requireOrgId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastOrganizationId: true }
  });

  if (user?.lastOrganizationId) return user.lastOrganizationId;

  const membership = await prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true }
  });

  if (!membership) {
    throw new Error("NO_WORKSPACE");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastOrganizationId: membership.organizationId }
  });

  return membership.organizationId;
}