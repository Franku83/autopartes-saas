import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireOrgId, requireUser } from "@/lib/session";

const schema = z.object({
  invoiceNumber: z.string().max(60).optional(),
  currency: z.enum(["USD"]).default("USD"),
  items: z.array(
    z.object({
      stockItemId: z.string().min(1),
      quantity: z.coerce.number().int().min(1),
      unitPriceUsd: z.coerce.number().min(0).optional()
    })
  ).min(1)
});

export async function GET(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(10, Number(searchParams.get("pageSize") ?? "20") || 20));
  const skip = (page - 1) * pageSize;

  const where: any = { organizationId: orgId };
  if (q) {
    where.OR = [
      { invoiceNumber: { contains: q, mode: "insensitive" } },
      { soldBy: { email: { contains: q, mode: "insensitive" } } }
    ];
  }

  const [total, items] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        invoiceNumber: true,
        currency: true,
        totalUsd: true,
        createdAt: true,
        soldBy: { select: { email: true, name: true } }
      }
    })
  ]);

  return NextResponse.json({ page, pageSize, total, items }, { status: 200 });
}

export async function POST(req: Request) {
  const { userId } = await requireUser();
  const orgId = await requireOrgId(userId);

  const membership = await prisma.membership.findUnique({
    where: { userId_organizationId: { userId, organizationId: orgId } },
    select: { role: true }
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "STAFF")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }

  const input = parsed.data;

  const result = await prisma.$transaction(async (tx) => {
    const stockIds = input.items.map((i) => i.stockItemId);

    const stock = await tx.stockItem.findMany({
      where: { organizationId: orgId, id: { in: stockIds } },
      select: { id: true, quantity: true, status: true, priceUsd: true }
    });

    if (stock.length !== stockIds.length) {
      throw new Error("STOCK_NOT_FOUND");
    }

    const stockMap = new Map(stock.map((s) => [s.id, s]));

    for (const line of input.items) {
      const s = stockMap.get(line.stockItemId)!;

      if (s.status !== "AVAILABLE" && s.status !== "RESERVED") {
        throw new Error("INVALID_STATUS");
      }

      if (line.quantity > s.quantity) {
        throw new Error("INSUFFICIENT_QTY");
      }
    }

    let totalUsd = 0;

    for (const line of input.items) {
      const s = stockMap.get(line.stockItemId)!;
      const unit = typeof line.unitPriceUsd === "number" ? line.unitPriceUsd : Number(s.priceUsd);
      totalUsd += unit * line.quantity;
    }

    const sale = await tx.sale.create({
      data: {
        organizationId: orgId,
        invoiceNumber: input.invoiceNumber?.trim() || null,
        currency: "USD",
        totalUsd: String(totalUsd),
        soldByUserId: userId,
        items: {
          create: input.items.map((line) => {
            const s = stockMap.get(line.stockItemId)!;
            const unit = typeof line.unitPriceUsd === "number" ? line.unitPriceUsd : Number(s.priceUsd);

            return {
              stockItemId: line.stockItemId,
              quantity: line.quantity,
              unitPriceUsd: String(unit)
            };
          })
        }
      },
      select: { id: true }
    });

    for (const line of input.items) {
      const s = stockMap.get(line.stockItemId)!;
      const remaining = s.quantity - line.quantity;

      await tx.stockItem.update({
        where: { id: line.stockItemId },
        data: {
          quantity: remaining,
          status: remaining === 0 ? "SOLD" : s.status === "RESERVED" ? "RESERVED" : "AVAILABLE"
        }
      });
    }

    return { saleId: sale.id };
  });

  return NextResponse.json(result, { status: 201 });
}