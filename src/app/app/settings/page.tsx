import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";
import JoinCodePanel from "@/components/settings/join-code-panel";
import WhitelistPanel from "@/components/settings/whitelist-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsChart from "@/components/settings/stats-chart";
import PublicCatalogPanel from "@/components/settings/public-catalog-panel";

export default async function SettingsPage() {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const [membership, org] = await Promise.all([
    prisma.membership.findUnique({
      where: { userId_organizationId: { userId, organizationId: orgId } },
      select: { role: true }
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, slug: true }
    })
  ]);

  const isOwner = membership?.role === "OWNER";

  // Aggregated data only for owners
  let statsData = null;
  if (isOwner) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const [totalSales, topSellers, monthlyTrend] = await Promise.all([
      // 1. Total USD
      prisma.sale.aggregate({
        where: { organizationId: orgId },
        _sum: { totalUsd: true }
      }),

      // 2. Ranking de empleados
      prisma.sale.groupBy({
        by: ["soldByUserId"],
        where: { organizationId: orgId },
        _sum: { totalUsd: true },
        orderBy: { _sum: { totalUsd: "desc" } },
        take: 5
      }),

      // 3. Tendencia mensual
      prisma.sale.findMany({
        where: {
          organizationId: orgId,
          createdAt: { gte: oneYearAgo }
        },
        select: {
          totalUsd: true,
          createdAt: true
        }
      })
    ]);

    // Fetch user names for ranking
    const sellerIds = topSellers.map(s => s.soldByUserId);
    const users = await prisma.user.findMany({
      where: { id: { in: sellerIds } },
      select: { id: true, name: true, email: true }
    });

    const sellersWithNames = topSellers.map(s => {
      const u = users.find(user => user.id === s.soldByUserId);
      return {
        name: u?.name || u?.email || "Unknown",
        total: Number(s._sum.totalUsd || 0)
      };
    });

    // Process monthly trend
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const trendMap = new Map<string, number>();

    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trendMap.set(label, 0);
    }

    monthlyTrend.forEach(sale => {
      const d = new Date(sale.createdAt);
      const label = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      if (trendMap.has(label)) {
        trendMap.set(label, (trendMap.get(label) || 0) + Number(sale.totalUsd || 0));
      }
    });

    const chartData = Array.from(trendMap.entries()).map(([month, total]) => ({
      month,
      total: Number(total.toFixed(2))
    }));

    statsData = {
      totalUsd: Number(totalSales._sum.totalUsd || 0),
      topSellers: sellersWithNames,
      chartData
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ajustes</h1>
        <p className="text-sm text-gray-600 mt-1">
          {isOwner ? "Configuración del negocio y accesos." : "Configuración de tu cuenta."}
        </p>
      </div>

      {isOwner ? (
        <div className="space-y-6">
          {statsData && (
            <>
              <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ventas Totales (USD)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${statsData.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <p className="text-xs text-muted-foreground">Histórico acumulado</p>
                  </CardContent>
                </Card>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Tendencia de Ventas</CardTitle>
                    <CardDescription>Ventas mensuales del último año (USD)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StatsChart data={statsData.chartData} />
                  </CardContent>
                </Card>

                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Top Sellers</CardTitle>
                    <CardDescription>Vendedores con mayor volumen de ventas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendedor</TableHead>
                          <TableHead className="text-right">Total (USD)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statsData.topSellers.map((seller, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{seller.name}</TableCell>
                            <TableCell className="text-right">${seller.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                        {statsData.topSellers.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center text-muted-foreground h-24">
                              No hay ventas registradas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          <PublicCatalogPanel 
            initialSlug={org?.slug || null} 
            orgName={org?.name || "Mi Negocio"} 
          />

          <JoinCodePanel />
          <WhitelistPanel />
        </div>
      ) : (
        <section className="rounded-xl border bg-white p-4">
          <div className="text-sm font-medium">Cuenta</div>
          <div className="text-sm text-gray-600 mt-2">
            Tu rol no permite ver configuraciones de acceso del negocio.
          </div>
        </section>
      )}
    </div>
  );
}
