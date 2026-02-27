"use client";

import { useEffect, useState } from "react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  engineCode: string | null;
};

type Item = {
  id: string;
  quantity: number;
  status: string;
  priceUsd: string;
  priceVes: string | null;
  createdAt: string;
  partModel: { sku: string; name: string; category: string };
  location: { name: string } | null;
};

export default function VehiclePartsClient({ vehicleId }: { vehicleId: string }) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState("AVAILABLE");
  const [loading, setLoading] = useState(false);

  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState<number | "">(1);
  const [priceUsd, setPriceUsd] = useState<number | "">("");
  const [priceVes, setPriceVes] = useState<number | "">("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [compatibility, setCompatibility] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/vehicles/${vehicleId}/parts/list?status=${encodeURIComponent(status)}`);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setError(data?.error ?? "No se pudo cargar las piezas");
      setLoading(false);
      return;
    }

    setVehicle(data.vehicle);
    setItems(data.items ?? []);
    setLoading(false);
  }

  async function addPart() {
    setError(null);

    const payload = {
        sku,
        name,
        category,
         compatibility: compatibility || undefined,
        quantity: String(quantity),
        priceUsd: String(priceUsd),
        locationName: locationName || undefined,
        notes: notes || undefined
    };

    const res = await fetch(`/api/vehicles/${vehicleId}/parts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setError("No se pudo agregar la pieza");
      return;
    }

    setSku("");
    setName("");
    setCategory("");
    setQuantity(1);
    setPriceUsd("");
    setPriceVes("");
    setLocationName("");
    setNotes("");
    setCompatibility("");

    await load();
  }

  useEffect(() => {
    load();
  }, [status]);

  return (
    <div className="space-y-6">
      <div>
        <a className="underline text-sm" href="/app/vehicles">
          Volver
        </a>
        <h1 className="text-2xl font-semibold mt-2">
          {vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : "Vehículo"}
        </h1>
        {vehicle?.engineCode ? <div className="text-sm text-gray-600">Motor: {vehicle.engineCode}</div> : null}
        {vehicle?.trim ? <div className="text-sm text-gray-600">Trim: {vehicle.trim}</div> : null}
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">Piezas</div>
          <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="AVAILABLE">Disponibles</option>
            <option value="RESERVED">Reservadas</option>
            <option value="SOLD">Vendidas</option>
            <option value="DISCARDED">Descartadas</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">{loading ? "Cargando..." : `${items.length} item(s)`}</div>

        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-6 gap-2 border-b px-3 py-2 text-sm font-medium">
            <div>SKU</div>
            <div>Nombre</div>
            <div>Categoría</div>
            <div>Cant.</div>
            <div>Precio</div>
            <div>Ubicación</div>
          </div>

          {items.map((it) => (
            <div key={it.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm border-b">
              <div className="truncate">{it.partModel.sku}</div>
              <div className="truncate">{it.partModel.name}</div>
              <div className="truncate">{it.partModel.category}</div>
              <div>{it.quantity}</div>
              <div className="truncate">
                {it.priceUsd}
                {it.priceVes ? ` / ${it.priceVes}` : ""}
              </div>
              <div className="truncate">{it.location?.name ?? ""}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Agregar pieza</div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className="border rounded-md px-3 py-2" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Categoría" value={category} onChange={(e) => setCategory(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Cantidad" value={quantity} onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : "")} />
          <input className="border rounded-md px-3 py-2" placeholder="Precio USD" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value ? Number(e.target.value) : "")} />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <input className="border rounded-md px-3 py-2" placeholder="Ubicación (Estante A3)" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Compatibilidad (opcional)" value={compatibility} onChange={(e) => setCompatibility(e.target.value)} />
        </div>

        <textarea className="border rounded-md px-3 py-2 w-full" placeholder="Notas (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button className="rounded-md border px-3 py-2 text-sm font-medium" onClick={addPart} type="button">
          Agregar
        </button>
      </section>
    </div>
  );
}