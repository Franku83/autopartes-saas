"use client";

import { useEffect, useMemo, useState } from "react";

type SearchItem = {
  id: string;
  quantity: number;
  status: string;
  priceUsd: string;
  partModel: { sku: string; name: string; category: string };
  vehicle: { make: string; model: string; year: number; engineCode: string | null } | null;
  location: { name: string } | null;
};

type CartLine = {
  stockItemId: string;
  sku: string;
  name: string;
  availableQty: number;
  quantity: number;
  unitPriceUsd: string;
};

type SaleRow = {
  id: string;
  invoiceNumber: string | null;
  currency: string;
  totalUsd: string | null;
  createdAt: string;
  soldBy: { email: string; name: string | null };
};

export default function SalesClient() {
  const [searchQ, setSearchQ] = useState("");
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [salesQ, setSalesQ] = useState("");
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize] = useState(20);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const salesQuery = useMemo(() => {
    const sp = new URLSearchParams();
    if (salesQ) sp.set("q", salesQ);
    sp.set("page", String(salesPage));
    sp.set("pageSize", String(salesPageSize));
    return sp.toString();
  }, [salesQ, salesPage, salesPageSize]);

  async function loadSearch() {
    setError(null);
    const res = await fetch(`/api/sales/items?q=${encodeURIComponent(searchQ)}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo buscar");
      return;
    }
    setSearchItems(data.items ?? []);
  }

  async function loadSales() {
    const res = await fetch(`/api/sales?${salesQuery}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) return;
    setSales(data.items ?? []);
    setSalesTotal(data.total ?? 0);
  }

  function addToCart(it: SearchItem) {
    setOk(null);
    setError(null);

    setCart((prev) => {
      const exists = prev.find((p) => p.stockItemId === it.id);
      if (exists) return prev;

      return [
        ...prev,
        {
          stockItemId: it.id,
          sku: it.partModel.sku,
          name: it.partModel.name,
          availableQty: it.quantity,
          quantity: 1,
          unitPriceUsd: String(it.priceUsd)
        }
      ];
    });
  }

  function updateQty(stockItemId: string, qty: number) {
    setCart((prev) =>
      prev.map((l) => {
        if (l.stockItemId !== stockItemId) return l;
        const safe = Math.max(1, Math.min(l.availableQty, qty));
        return { ...l, quantity: safe };
      })
    );
  }

  function updatePrice(stockItemId: string, price: string) {
    setCart((prev) =>
      prev.map((l) => (l.stockItemId === stockItemId ? { ...l, unitPriceUsd: price } : l))
    );
  }

  function removeLine(stockItemId: string) {
    setCart((prev) => prev.filter((l) => l.stockItemId !== stockItemId));
  }

  const totalUsd = cart.reduce((sum, l) => sum + Number(l.unitPriceUsd || 0) * l.quantity, 0);

  async function finalizeSale() {
    setError(null);
    setOk(null);

    if (!cart.length) {
      setError("Carrito vacío");
      return;
    }

    const payload = {
      invoiceNumber: invoiceNumber || undefined,
      currency: "USD",
      items: cart.map((l) => ({
        stockItemId: l.stockItemId,
        quantity: l.quantity,
        unitPriceUsd: l.unitPriceUsd ? Number(l.unitPriceUsd) : undefined
      }))
    };

    const res = await fetch("/api/sales", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        data?.error === "INSUFFICIENT_QTY"
          ? "Cantidad insuficiente"
          : data?.error === "INVALID_STATUS"
          ? "Algún item no está disponible"
          : data?.error ?? "No se pudo crear la venta";
      setError(msg);
      return;
    }

    setOk("Venta creada");
    setCart([]);
    setInvoiceNumber("");
    await loadSales();
    await loadSearch();
  }

  const salesPages = Math.max(1, Math.ceil(salesTotal / salesPageSize));

  useEffect(() => {
    loadSales();
  }, [salesQuery]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Ventas</h1>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Crear venta</div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Buscar (SKU, nombre, carro, motor...)"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <button className="border rounded-md px-3 py-2 text-sm font-medium" type="button" onClick={loadSearch}>
            Buscar
          </button>
          <input
            className="border rounded-md px-3 py-2"
            placeholder="Factura o referencia (opcional)"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div className="grid gap-2 lg:grid-cols-2">
          <div className="rounded-md border overflow-hidden">
            <div className="border-b px-3 py-2 text-sm font-medium">Resultados</div>
            {searchItems.map((it) => (
              <div key={it.id} className="px-3 py-2 border-b text-sm flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate">{it.partModel.sku} - {it.partModel.name}</div>
                  <div className="text-xs text-gray-600 truncate">
                    Disp: {it.quantity} | ${it.priceUsd} | {it.vehicle ? `${it.vehicle.make} ${it.vehicle.model} ${it.vehicle.year}` : ""} {it.vehicle?.engineCode ? `(${it.vehicle.engineCode})` : ""}
                  </div>
                </div>
                <button className="border rounded-md px-2 py-1" type="button" onClick={() => addToCart(it)}>
                  Agregar
                </button>
              </div>
            ))}
            {!searchItems.length ? <div className="px-3 py-3 text-sm text-gray-600">Sin resultados</div> : null}
          </div>

          <div className="rounded-md border overflow-hidden">
            <div className="border-b px-3 py-2 text-sm font-medium">Carrito</div>

            {cart.map((l) => (
              <div key={l.stockItemId} className="px-3 py-2 border-b text-sm grid grid-cols-12 gap-2 items-center">
                <div className="col-span-4 truncate">{l.sku}</div>
                <div className="col-span-4 truncate">{l.name}</div>
                <input
                  className="col-span-1 border rounded-md px-2 py-1"
                  value={l.quantity}
                  onChange={(e) => updateQty(l.stockItemId, Number(e.target.value || 1))}
                />
                <input
                  className="col-span-2 border rounded-md px-2 py-1"
                  value={l.unitPriceUsd}
                  onChange={(e) => updatePrice(l.stockItemId, e.target.value)}
                />
                <button className="col-span-1 border rounded-md px-2 py-1" type="button" onClick={() => removeLine(l.stockItemId)}>
                  X
                </button>
              </div>
            ))}

            {!cart.length ? <div className="px-3 py-3 text-sm text-gray-600">Carrito vacío</div> : null}

            <div className="px-3 py-2 text-sm flex items-center justify-between">
              <div>Total USD</div>
              <div className="font-medium">{totalUsd.toFixed(2)}</div>
            </div>

            <div className="px-3 pb-3">
              <button className="border rounded-md px-3 py-2 text-sm font-medium w-full" type="button" onClick={finalizeSale}>
                Finalizar venta
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm">{ok}</p> : null}
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Historial</div>

        <div className="flex gap-2">
          <input className="border rounded-md px-3 py-2 flex-1" placeholder="Buscar por factura o email" value={salesQ} onChange={(e) => setSalesQ(e.target.value)} />
          <button className="border rounded-md px-3 py-2 text-sm font-medium" type="button" onClick={() => setSalesPage(1)}>
            Buscar
          </button>
        </div>

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-5 gap-2 border-b px-3 py-2 text-sm font-medium">
            <div>Fecha</div>
            <div>Factura</div>
            <div>Total</div>
            <div>Vendedor</div>
            <div>ID</div>
          </div>

          {sales.map((s) => (
            <div key={s.id} className="grid grid-cols-5 gap-2 px-3 py-2 text-sm border-b">
              <div>{new Date(s.createdAt).toLocaleString()}</div>
              <div className="truncate">{s.invoiceNumber ?? ""}</div>
              <div>{Number(s.totalUsd ?? 0).toFixed(2)} USD</div>
              <div className="truncate">{s.soldBy.email}</div>
              <div className="truncate">{s.id}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {salesPage} de {Math.max(1, Math.ceil(salesTotal / salesPageSize))}
          </div>
          <div className="flex gap-2">
            <button className="border rounded-md px-3 py-2 text-sm" disabled={salesPage <= 1} onClick={() => setSalesPage((p) => p - 1)} type="button">
              Anterior
            </button>
            <button className="border rounded-md px-3 py-2 text-sm" disabled={salesPage >= salesPages} onClick={() => setSalesPage((p) => p + 1)} type="button">
              Siguiente
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}