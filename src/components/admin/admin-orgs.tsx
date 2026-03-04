"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type OrgRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  owners: string[];
  members: number;
  sales30d: { count: number; totalUsd: number };
};

export default function AdminOrgs() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(() => {
    const sp = new URLSearchParams();
    if (q.trim()) sp.set("q", q.trim());
    return sp.toString();
  }, [q]);

  async function load() {
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/admin/orgs?${query}`);
    const data = await res.json().catch(() => null);
    setLoading(false);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setItems(data?.items ?? []);
  }

  async function preapproveOwner() {
    setMsg(null);
    setErr(null);

    const emailNorm = email.toLowerCase().trim();
    if (!emailNorm) {
      setErr("Escribe un email.");
      return;
    }

    const res = await fetch("/api/admin/orgs/preapprove-owner", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: emailNorm })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setMsg(`Owner pre-aprobado. Org creada: ${data?.org?.name ?? "Pendiente"}`);
    setEmail("");
    await load();
  }

  async function setOrgStatus(orgId: string, status: "ACTIVE" | "SUSPENDED") {
    setMsg(null);
    setErr(null);

    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setMsg(status === "SUSPENDED" ? "Organización suspendida." : "Organización activada.");
    await load();
  }

  useEffect(() => {
    load();
  }, [query]);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-gray-500">Admin</div>
        <h1 className="text-2xl font-semibold">Organizaciones</h1>
        <div className="text-sm text-gray-600 mt-1">
          Gestiona empresas, owners, estado y acceso.
        </div>
      </div>

      <section className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="text-sm font-medium">Preaprobar Owner</div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="border rounded-xl px-3 py-2 flex-1"
            placeholder="email del owner"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            type="button"
            onClick={preapproveOwner}
          >
            Preaprobar
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Crea una org provisional “Pendiente - email” y habilita ese email para registrarse como OWNER.
        </div>

        {err ? <div className="rounded-xl border bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div> : null}
        {msg ? <div className="rounded-xl border bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{msg}</div> : null}
      </section>

      <section className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="text-sm font-medium">Buscar</div>
        <input
          className="border rounded-xl px-3 py-2 w-full"
          placeholder="Buscar por nombre de empresa…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="text-sm text-gray-600">{loading ? "Cargando..." : `${items.length} organización(es)`}</div>
      </section>

      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b px-4 py-3 text-sm font-medium">
          <div className="col-span-3">Empresa</div>
          <div className="col-span-2">Estado</div>
          <div className="col-span-2">Owners</div>
          <div className="col-span-1">Users</div>
          <div className="col-span-2">Ventas 30d</div>
          <div className="col-span-2">Acciones</div>
        </div>

        {items.map((o) => (
          <div key={o.id} className="grid grid-cols-12 gap-2 px-4 py-3 text-sm border-b items-center">
            <div className="col-span-3 min-w-0">
              <div className="font-medium truncate">{o.name}</div>
              <div className="text-xs text-gray-500 truncate">{o.id}</div>
            </div>

            <div className="col-span-2">
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border",
                  o.status === "ACTIVE" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-amber-50 text-amber-800 border-amber-200"
                ].join(" ")}
              >
                {o.status}
              </span>
            </div>

            <div className="col-span-2 truncate">{o.owners.length ? o.owners.join(", ") : "—"}</div>
            <div className="col-span-1">{o.members}</div>

            <div className="col-span-2">
              <div className="font-medium">{o.sales30d.totalUsd.toFixed(2)} USD</div>
              <div className="text-xs text-gray-500">{o.sales30d.count} ventas</div>
            </div>

            <div className="col-span-2 flex gap-2">
              <Link className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50" href={`/admin/orgs/${o.id}`}>
                Ver
              </Link>

              {o.status === "ACTIVE" ? (
                <button
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  type="button"
                  onClick={() => setOrgStatus(o.id, "SUSPENDED")}
                >
                  Suspender
                </button>
              ) : (
                <button
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  type="button"
                  onClick={() => setOrgStatus(o.id, "ACTIVE")}
                >
                  Activar
                </button>
              )}
            </div>
          </div>
        ))}

        {!items.length && !loading ? <div className="px-4 py-6 text-sm text-gray-600">Sin resultados.</div> : null}
      </section>
    </div>
  );
}