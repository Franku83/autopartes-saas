import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isDisabled: true }
  });

  if (!user || user.isDisabled) {
    throw new Error("USER_DISABLED");
  }

  return { userId };
}

export async function requireOrgId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastOrganizationId: true }
  });

  let orgId = user?.lastOrganizationId ?? null;

  if (!orgId) {
    const membership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { organizationId: true }
    });

    if (!membership) {
      throw new Error("NO_WORKSPACE");
    }

    orgId = membership.organizationId;

    await prisma.user.update({
      where: { id: userId },
      data: { lastOrganizationId: orgId }
    });
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { status: true }
  });

  if (!org) {
    throw new Error("NO_WORKSPACE");
  }

  if (org.status === "SUSPENDED") {
    throw new Error("ORG_SUSPENDED");
  }

  return orgId;
}