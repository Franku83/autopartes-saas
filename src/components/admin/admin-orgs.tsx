"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Building2, Users, DollarSign, ExternalLink } from "lucide-react";

type OrgRow = {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  owners: string[];
  members: number;
  sales30d: { count: number; totalUsd: number };
};

type GlobalStats = {
  totalOrgs: number;
  activeUsers: number;
  totalSalesUsd: number;
};

export default function AdminOrgs() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<OrgRow[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);
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
    try {
      const [orgsRes, statsRes] = await Promise.all([
        fetch(`/api/admin/orgs?${query}`),
        fetch("/api/admin/stats")
      ]);

      const orgsData = await orgsRes.json();
      const statsData = await statsRes.json();

      if (!orgsRes.ok) throw new Error(orgsData.error || "Error cargando organizaciones");
      if (!statsRes.ok) throw new Error(statsData.error || "Error cargando estadísticas");

      setItems(orgsData?.items ?? []);
      setStats(statsData);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
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
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
          <p className="text-muted-foreground mt-1">Gestión global de la plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="pl-9 border rounded-xl px-4 py-2 text-sm w-full md:w-[300px] focus:ring-2 focus:ring-black outline-none transition-all"
              placeholder="Buscar organizaciones..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Organizaciones</p>
            <h2 className="text-2xl font-bold">{stats?.totalOrgs ?? "..."}</h2>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <Users className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Usuarios Activos</p>
            <h2 className="text-2xl font-bold">{stats?.activeUsers ?? "..."}</h2>
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Volumen de Ventas</p>
            <h2 className="text-2xl font-bold">
              ${stats?.totalSalesUsd.toLocaleString(undefined, { minimumFractionDigits: 2 }) ?? "..."}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              Preaprobar Nuevo Owner
            </h3>
            <div className="space-y-3">
              <input
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
                type="button"
                onClick={preapproveOwner}
              >
                Preaprobar Acceso
              </button>
              <p className="text-xs text-gray-400">
                Crea una organización provisional y permite el registro como OWNER.
              </p>
            </div>

            {err ? <div className="p-3 text-xs bg-red-50 text-red-600 rounded-lg border border-red-100">{err}</div> : null}
            {msg ? <div className="p-3 text-xs bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">{msg}</div> : null}
          </section>
        </div>

        <div className="lg:col-span-2">
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Lista de Organizaciones</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
                {items.length} total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-gray-500 uppercase text-[10px] tracking-widest font-bold border-b">
                    <th className="px-6 py-3">Organización</th>
                    <th className="px-6 py-3">Estado</th>
                    <th className="px-6 py-3">Métricas</th>
                    <th className="px-6 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{o.name}</div>
                        <div className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">{o.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
                            o.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          ].join(" ")}
                        >
                          {o.status === "ACTIVE" ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-gray-700">
                            <Users className="h-3 w-3 text-gray-400" />
                            {o.members} <span className="text-xs text-gray-400 font-normal">miembros</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-medium text-gray-700">
                            <DollarSign className="h-3 w-3 text-gray-400" />
                            {o.sales30d.totalUsd.toFixed(0)} <span className="text-xs text-gray-400 font-normal">30d total</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/orgs/${o.id}`}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-black"
                            title="Gestionar"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          {o.status === "ACTIVE" ? (
                            <button
                              className="text-xs font-bold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                              onClick={() => setOrgStatus(o.id, "SUSPENDED")}
                            >
                              Suspender
                            </button>
                          ) : (
                            <button
                              className="text-xs font-bold text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                              onClick={() => setOrgStatus(o.id, "ACTIVE")}
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!items.length && !loading && (
                <div className="p-12 text-center text-gray-400 text-sm italic">
                  No se encontraron organizaciones.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
