import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import { ensureExchangeRate } from "@/lib/exchange-rate";

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

  const rate = await ensureExchangeRate(orgId, 12);

  const totalUsdNumber = Number(totalUsd._sum.priceUsd ?? 0);
  const rateNumber = Number(rate.rateVesPerUsd);
  const totalVes = totalUsdNumber * rateNumber;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{org?.name ?? "Workspace"}</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Piezas disponibles</div>
          <div className="mt-2 text-2xl font-semibold">{partsAvailable}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Valor de stock (USD)</div>
          <div className="mt-2 text-2xl font-semibold">{totalUsdNumber.toFixed(2)}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Tasa BCV (VES/USD)</div>
          <div className="mt-2 text-2xl font-semibold">{rateNumber.toFixed(4)}</div>
          <div className="mt-1 text-xs text-gray-500">{rate.effectiveAt.toLocaleString()}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Valor de stock (VES)</div>
          <div className="mt-2 text-2xl font-semibold">{totalVes.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}