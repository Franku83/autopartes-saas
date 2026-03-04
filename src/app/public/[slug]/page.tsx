import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ensureExchangeRate } from "@/lib/exchange-rate";
import PublicCatalogClient from "@/components/public/public-catalog-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PublicCatalogPage({ params }: PageProps) {
  const { slug } = await params;

  if (!slug) {
    return notFound();
  }

  const org = await prisma.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, status: true }
  });

  if (!org || org.status !== "ACTIVE") {
    return notFound();
  }

  const [items, rate] = await Promise.all([
    prisma.stockItem.findMany({
      where: {
        organizationId: org.id,
        status: "AVAILABLE",
        quantity: { gt: 0 }
      },
      include: {
        partModel: {
          select: {
            sku: true,
            name: true,
            category: true,
            compatibility: true,
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            engineCode: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    ensureExchangeRate(org.id)
  ]);

  const bcvRate = Number(rate.rateVesPerUsd);

  // Convert Decimals to strings for serialization
  const serializableItems = items.map(item => ({
    ...item,
    priceUsd: item.priceUsd.toString(),
  }));

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 border-b pb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{org.name}</h1>
        <p className="text-muted-foreground mt-2 text-lg">Catálogo Público de Inventario</p>
        <div className="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium border border-blue-100">
          Tasa BCV: {bcvRate.toFixed(4)} VES/USD
        </div>
      </header>

      <PublicCatalogClient items={serializableItems} bcvRate={bcvRate} />
    </div>
  );
}
