import { prisma } from "@/lib/prisma";

type DolarApiOficial = {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
};

export async function ensureExchangeRate(orgId: string, maxAgeHours = 12) {
  const latest = await prisma.exchangeRate.findFirst({
    where: { organizationId: orgId },
    orderBy: { effectiveAt: "desc" },
    select: { rateVesPerUsd: true, effectiveAt: true }
  });

  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

  if (latest && now - latest.effectiveAt.getTime() < maxAgeMs) {
    return latest;
  }

  const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial", {
    cache: "no-store"
  });

  if (!res.ok) {
    if (latest) return latest;
    throw new Error("RATE_FETCH_FAILED");
  }

  const data = (await res.json()) as DolarApiOficial;

  const effectiveAt = new Date(data.fechaActualizacion);
  const rate = data.promedio;

  const created = await prisma.exchangeRate.create({
    data: {
      organizationId: orgId,
      rateVesPerUsd: String(rate),
      effectiveAt: isNaN(effectiveAt.getTime()) ? new Date() : effectiveAt
    },
    select: { rateVesPerUsd: true, effectiveAt: true }
  });

  return created;
}