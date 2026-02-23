import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true }
  });

  const partsAvailable = await prisma.stockItem.count({
    where: { organizationId: orgId, status: "AVAILABLE" }
  });

  const totalUsd = await prisma.stockItem.aggregate({
    where: { organizationId: orgId, status: "AVAILABLE" },
    _sum: { priceUsd: true }
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{org?.name ?? "Workspace"}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Piezas disponibles</div>
          <div className="mt-2 text-2xl font-semibold">{partsAvailable}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Valor de stock (USD)</div>
          <div className="mt-2 text-2xl font-semibold">
            {(totalUsd._sum.priceUsd ?? 0).toString()}
          </div>
        </div>
      </div>
    </div>
  );
}