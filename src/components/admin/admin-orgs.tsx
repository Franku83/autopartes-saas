"use client";

import { useEffect, useState } from "react";

type Org = {
  id: string;
  name: string;
  createdAt: string;
  memberships: { user: { id: string; email: string; name: string | null } }[];
};

export default function AdminOrgs() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/orgs");
    if (!res.ok) return;
    const data = await res.json();
    setOrgs(data.orgs ?? []);
  }

  async function setOwner() {
    setError(null);
    setOk(null);

    const res = await fetch("/api/admin/orgs/set-owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ organizationId, email })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "ERROR");
      return;
    }

    setOk("OWNER asignado");
    setEmail("");
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Organizaciones</h1>

      <section className="rounded-xl border p-4 space-y-3">
        <div className="text-sm text-gray-600">Asignar OWNER por email</div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            className="border rounded-md px-3 py-2 flex-1"
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
          >
            <option value="">Selecciona organización</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>

          <input
            className="border rounded-md px-3 py-2 flex-1"
            placeholder="email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button className="rounded-md border px-3 py-2 text-sm font-medium" onClick={setOwner} type="button">
            Asignar
          </button>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {ok ? <p className="text-sm">{ok}</p> : null}
      </section>

      <section className="rounded-xl border overflow-hidden">
        <div className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Empresa</div>
          <div>Owners</div>
          <div>Creada</div>
        </div>

        {orgs.map((o) => (
          <div key={o.id} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm border-b">
            <div className="truncate">{o.name}</div>
            <div className="truncate">
              {o.memberships.length ? o.memberships.map((m) => m.user.email).join(", ") : "Sin owner"}
            </div>
            <div>{new Date(o.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </section>
    </div>
  );
}