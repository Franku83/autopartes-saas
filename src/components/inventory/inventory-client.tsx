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

type VehicleOption = {
  id: string;
  make: string;
  model: string;
  year: number;
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

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [priceUsd, setPriceUsd] = useState<number | "">("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [formLoading, setFormLoading] = useState(false);

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

  async function loadVehicles() {
    const res = await fetch("/api/vehicles");
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setVehicles(data.items ?? []);
    }
  }

  async function addPart() {
    setFormLoading(true);
    setError(null);

    const payload = {
      sku: sku.trim(),
      name: name.trim(),
      category: formCategory.trim(),
      compatibility: compatibility.trim() || undefined,
      quantity: Number(quantity) || 1,
      priceUsd: Number(priceUsd) || 0,
      locationName: locationName.trim() || undefined,
      notes: notes.trim() || undefined,
      vehicleId: selectedVehicleId || null
    };

    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo agregar el repuesto");
      setFormLoading(false);
      return;
    }

    // Reset form
    setSku("");
    setName("");
    setFormCategory("");
    setQuantity(1);
    setPriceUsd("");
    setLocationName("");
    setNotes("");
    setCompatibility("");
    setSelectedVehicleId("");
    setShowAddForm(false);
    setFormLoading(false);

    await load();
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

  useEffect(() => {
    if (showAddForm && vehicles.length === 0) {
      loadVehicles();
    }
  }, [showAddForm]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Inventario</h1>
          <div className="text-sm text-gray-600 mt-1">
            Tasa BCV: {rate ? rate.toFixed(4) : "—"} {rateAt ? `(${rateAt})` : ""}
          </div>
        </div>
        <button
          className="bg-black text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancelar" : "Agregar Repuesto General"}
        </button>
      </div>

      {showAddForm && (
        <section className="rounded-xl border p-4 space-y-4 bg-gray-50/50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="text-sm font-medium">Nuevo Repuesto General</div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">SKU *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="SKU-123" value={sku} onChange={(e) => setSku(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Nombre *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Filtro de Aceite" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Categoría *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Motores" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Vehículo (Opcional)</label>
              <select className="w-full border rounded-md px-3 py-2 text-sm" value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}>
                <option value="">Ninguno / Universal</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.year})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Cantidad *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Precio USD *</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" type="number" placeholder="0.00" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value ? Number(e.target.value) : "")} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Ubicación</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Estante A1" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-500 ml-1">Compatibilidad</label>
              <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Varios modelos" value={compatibility} onChange={(e) => setCompatibility(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 ml-1">Notas</label>
            <textarea className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Notas adicionales..." value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end pt-2">
            <button
              className="bg-black text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50"
              onClick={addPart}
              disabled={formLoading || !sku || !name || !formCategory || !quantity || !priceUsd}
            >
              {formLoading ? "Guardando..." : "Guardar Repuesto"}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Buscar y filtrar</div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="SKU, nombre, carro, motor..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RESERVED">Reservadas</option>
            <option value="SOLD">Vendidas</option>
            <option value="DISCARDED">Descartadas</option>
          </select>
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)} />
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Min USD" value={minUsd} onChange={(e) => setMinUsd(e.target.value)} />
          <input className="border rounded-md px-3 py-2 text-sm" placeholder="Max USD" value={maxUsd} onChange={(e) => setMaxUsd(e.target.value)} />
        </div>

        <div className="text-sm text-gray-600">
          {loading ? "Cargando..." : `${total} item(s)`}
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-10 gap-2 border-b px-3 py-2 text-sm font-medium bg-gray-50/50">
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
            <div key={it.id} className="grid grid-cols-10 gap-2 px-3 py-2 text-sm border-b items-center hover:bg-gray-50/30 transition-colors">
              <div className="truncate font-medium">{it.partModel.sku}</div>
              <div className="truncate">{it.partModel.name}</div>
              <div className="truncate">{it.partModel.category}</div>
              <div className="truncate">{it.vehicle ? `${it.vehicle.make} ${it.vehicle.model} ${it.vehicle.year}` : <span className="text-gray-400">—</span>}</div>
              <div className="truncate">{it.vehicle?.engineCode ?? <span className="text-gray-400">—</span>}</div>
              <div className="truncate">{it.location?.name ?? <span className="text-gray-400">—</span>}</div>
              <div className="font-medium">{it.quantity}</div>
              <div className="font-medium text-green-700">{usd.toFixed(2)}</div>
              <div className="text-gray-600">{rate ? ves.toFixed(2) : "—"}</div>
              <div className="flex gap-2">
                {it.status === "AVAILABLE" ? (
                  <button className="border rounded-md px-2 py-1 text-xs hover:bg-gray-100 transition-colors" onClick={() => quickUpdate(it.id, { status: "RESERVED" })} type="button">
                    Reservar
                  </button>
                ) : null}
                {it.status === "RESERVED" ? (
                  <button className="border rounded-md px-2 py-1 text-xs hover:bg-gray-100 transition-colors" onClick={() => quickUpdate(it.id, { status: "AVAILABLE" })} type="button">
                    Liberar
                  </button>
                ) : null}
                {it.status !== "DISCARDED" ? (
                  <button className="border rounded-md px-2 py-1 text-xs hover:bg-gray-100 transition-colors text-red-600 border-red-100" onClick={() => quickUpdate(it.id, { status: "DISCARDED" })} type="button">
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
          <button className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">
            Anterior
          </button>
          <button className="border rounded-md px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} type="button">
            Siguiente
          </button>
        </div>
      </section>
    </div>
  );
}