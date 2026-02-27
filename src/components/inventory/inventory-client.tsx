"use client";

import { useEffect, useMemo, useState } from "react";

type Item = {
  id: string;
  quantity: number;
  status: string;
  priceUsd: string;
  createdAt: string;
  partModel: { sku: string; name: string; category: string };
  vehicle: { id: string; make: string; model: string; year: number; engineCode: string | null } | null;
  location: { name: string } | null;
};

export default function InventoryClient() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("AVAILABLE");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [minUsd, setMinUsd] = useState("");
  const [maxUsd, setMaxUsd] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [rate, setRate] = useState<number>(0);
  const [rateAt, setRateAt] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (status) sp.set("status", status);
    if (category) sp.set("category", category);
    if (location) sp.set("location", location);
    if (minUsd) sp.set("minUsd", minUsd);
    if (maxUsd) sp.set("maxUsd", maxUsd);
    sp.set("page", String(page));
    sp.set("pageSize", String(pageSize));
    return sp.toString();
  }, [q, status, category, location, minUsd, maxUsd, page, pageSize]);

  async function load() {
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/inventory?${query}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setLoading(false);
      setError(data?.error ?? "No se pudo cargar inventario");
      return;
    }

    setItems(data.items ?? []);
    setTotal(data.total ?? 0);
    setRate(Number(data.rateVesPerUsd ?? 0));
    setRateAt(data.rateEffectiveAt ? new Date(data.rateEffectiveAt).toLocaleString() : "");
    setLoading(false);
  }

  async function quickUpdate(id: string, patch: any) {
    const res = await fetch(`/api/stock-items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo actualizar");
      return;
    }

    await load();
  }

  const pages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    load();
  }, [query]);

  useEffect(() => {
    setPage(1);
  }, [q, status, category, location, minUsd, maxUsd]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventario</h1>
        <div className="text-sm text-gray-600 mt-1">
          Tasa BCV: {rate ? rate.toFixed(4) : "—"} {rateAt ? `(${rateAt})` : ""}
        </div>
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Buscar y filtrar</div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className="border rounded-md px-3 py-2" placeholder="SKU, nombre, carro, motor..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="border rounded-md px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RESERVED">Reservadas</option>
            <option value="SOLD">Vendidas</option>
            <option value="DISCARDED">Descartadas</option>
          </select>
          <input className="border rounded-md px-3 py-2" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Min USD" value={minUsd} onChange={(e) => setMinUsd(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Max USD" value={maxUsd} onChange={(e) => setMaxUsd(e.target.value)} />
        </div>

        <div className="text-sm text-gray-600">
          {loading ? "Cargando..." : `${total} item(s)`}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-10 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>SKU</div>
          <div>Nombre</div>
          <div>Categoría</div>
          <div>Carro</div>
          <div>Motor</div>
          <div>Ubicación</div>
          <div>Cant.</div>
          <div>USD</div>
          <div>VES</div>
          <div>Acción</div>
        </div>

        {items.map((it) => {
          const usd = Number(it.priceUsd) * it.quantity;
          const ves = rate ? usd * rate : 0;

          return (
            <div key={it.id} className="grid grid-cols-10 gap-2 px-3 py-2 text-sm border-b items-center">
              <div className="truncate">{it.partModel.sku}</div>
              <div className="truncate">{it.partModel.name}</div>
              <div className="truncate">{it.partModel.category}</div>
              <div className="truncate">{it.vehicle ? `${it.vehicle.make} ${it.vehicle.model} ${it.vehicle.year}` : ""}</div>
              <div className="truncate">{it.vehicle?.engineCode ?? ""}</div>
              <div className="truncate">{it.location?.name ?? ""}</div>
              <div>{it.quantity}</div>
              <div>{usd.toFixed(2)}</div>
              <div>{rate ? ves.toFixed(2) : "—"}</div>
              <div className="flex gap-2">
                {it.status === "AVAILABLE" ? (
                  <button className="border rounded-md px-2 py-1" onClick={() => quickUpdate(it.id, { status: "RESERVED" })} type="button">
                    Reservar
                  </button>
                ) : null}
                {it.status === "RESERVED" ? (
                  <button className="border rounded-md px-2 py-1" onClick={() => quickUpdate(it.id, { status: "AVAILABLE" })} type="button">
                    Liberar
                  </button>
                ) : null}
                {it.status !== "DISCARDED" ? (
                  <button className="border rounded-md px-2 py-1" onClick={() => quickUpdate(it.id, { status: "DISCARDED" })} type="button">
                    Descartar
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      <section className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Página {page} de {pages}
        </div>
        <div className="flex gap-2">
          <button className="border rounded-md px-3 py-2 text-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">
            Anterior
          </button>
          <button className="border rounded-md px-3 py-2 text-sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} type="button">
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}