"use client";

import { useEffect, useMemo, useState } from "react";

type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  engineCode: string | null;
  vin: string | null;
  createdAt: string;
};

export default function VehiclesClient() {
  const [items, setItems] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [engineCode, setEngineCode] = useState("");

  const [formMake, setFormMake] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formYear, setFormYear] = useState<number | "">("");
  const [formTrim, setFormTrim] = useState("");
  const [formEngineCode, setFormEngineCode] = useState("");
  const [formVin, setFormVin] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (make) sp.set("make", make);
    if (model) sp.set("model", model);
    if (year !== "") sp.set("year", String(year));
    if (engineCode) sp.set("engineCode", engineCode);
    return sp.toString();
  }, [q, make, model, year, engineCode]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/vehicles?${query}`);
    const data = await res.json().catch(() => null);
    setItems(data?.items ?? []);
    setLoading(false);
  }

  async function createVehicle() {
    const payload = {
      make: formMake,
      model: formModel,
      year: Number(formYear),
      trim: formTrim || undefined,
      engineCode: formEngineCode || undefined,
      vin: formVin || undefined,
      notes: formNotes || undefined
    };

    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) return;

    setFormMake("");
    setFormModel("");
    setFormYear("");
    setFormTrim("");
    setFormEngineCode("");
    setFormVin("");
    setFormNotes("");
    await load();
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col lg:flex-row">
        <div>
          <h1 className="text-2xl font-semibold">Vehículos</h1>
          <p className="text-sm text-gray-600 mt-1">Carros donantes. Entra a uno para ver sus piezas.</p>
        </div>
      </div>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Buscar</div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input className="border rounded-md px-3 py-2" placeholder="Búsqueda general" value={q} onChange={(e) => setQ(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Marca" value={make} onChange={(e) => setMake(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Modelo" value={model} onChange={(e) => setModel(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Año" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : "")} />
          <input className="border rounded-md px-3 py-2" placeholder="Código motor" value={engineCode} onChange={(e) => setEngineCode(e.target.value)} />
        </div>

        <div className="text-sm text-gray-600">{loading ? "Cargando..." : `${items.length} resultado(s)`}</div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm font-medium">Agregar vehículo</div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          <input className="border rounded-md px-3 py-2" placeholder="Marca" value={formMake} onChange={(e) => setFormMake(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Modelo" value={formModel} onChange={(e) => setFormModel(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Año" value={formYear} onChange={(e) => setFormYear(e.target.value ? Number(e.target.value) : "")} />
          <input className="border rounded-md px-3 py-2" placeholder="Trim" value={formTrim} onChange={(e) => setFormTrim(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="Motor (4G94)" value={formEngineCode} onChange={(e) => setFormEngineCode(e.target.value)} />
          <input className="border rounded-md px-3 py-2" placeholder="VIN" value={formVin} onChange={(e) => setFormVin(e.target.value)} />
        </div>

        <textarea className="border rounded-md px-3 py-2 w-full" placeholder="Notas" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />

        <button className="rounded-md border px-3 py-2 text-sm font-medium" onClick={createVehicle} type="button">
          Crear
        </button>
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-6 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Marca</div>
          <div>Modelo</div>
          <div>Año</div>
          <div>Motor</div>
          <div>Trim</div>
          <div>VIN</div>
        </div>

        {items.map((v) => (
          <div key={v.id} className="grid grid-cols-6 gap-2 px-3 py-2 text-sm border-b">
            <a className="underline truncate" href={`/app/vehicles/${v.id}`}>
                {v.make}
            </a>
            <div className="truncate">{v.model}</div>
            <div>{v.year}</div>
            <div className="truncate">{v.engineCode ?? ""}</div>
            <div className="truncate">{v.trim ?? ""}</div>
            <div className="truncate">{v.vin ?? ""}</div>
          </div>
        ))}
      </section>
    </div>
  );
}