"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronLeft, ShieldCheck, UserMinus, UserPlus, Building, Mail, User } from "lucide-react";

type Org = {
  id: string;
  name: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
};

type Member = {
  role: "OWNER" | "STAFF" | "VIEWER";
  createdAt: string;
  user: { id: string; email: string; name: string | null; isDisabled: boolean };
};

export default function AdminOrgDetail({ orgId }: { orgId: string }) {
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");

  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!orgId) {
      setErr("ORG_ID_MISSING");
      return;
    }

    setLoading(true);
    setErr(null);
    setMsg(null);

    const res = await fetch(`/api/admin/orgs/${orgId}/members`);
    const data = await res.json().catch(() => null);

    setLoading(false);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setOrg(data.org);
    setName(data.org?.name ?? "");
    setMembers(data.members ?? []);
  }

  async function rename() {
    if (!orgId) return;

    setMsg(null);
    setErr(null);

    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setMsg("Nombre actualizado.");
    await load();
  }

  async function setOrgStatus(status: "ACTIVE" | "SUSPENDED") {
    if (!orgId) return;

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

  async function toggleUser(userId: string, isDisabled: boolean) {
    setMsg(null);
    setErr(null);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isDisabled })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setMsg(isDisabled ? "Usuario desactivado." : "Usuario activado.");
    await load();
  }

  async function updateRole(userId: string, role: "OWNER" | "STAFF" | "VIEWER") {
    setMsg(null);
    setErr(null);

    const res = await fetch(`/api/admin/orgs/${orgId}/members/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role })
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setErr(data?.error ?? "ERROR");
      return;
    }

    setMsg(`Rol actualizado a ${role}.`);
    await load();
  }

  useEffect(() => {
    load();
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <ChevronLeft className="h-5 w-5" />
          No se recibió orgId en la ruta.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <Link 
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors" 
            href="/admin"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a Organizaciones
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Building className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{org?.name ?? "..." }</h1>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">{orgId}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={[
              "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border",
              org?.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
            ].join(" ")}
          >
            {org?.status ?? "..."}
          </span>

          <button
            className="px-4 py-2 bg-white border rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors shadow-sm"
            onClick={() => setOrgStatus(org?.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
          >
            {org?.status === "ACTIVE" ? "Suspender Empresa" : "Activar Empresa"}
          </button>
        </div>
      </div>

      {(msg || err) && (
        <div className={[
          "p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
          err ? "bg-red-50 border-red-100 text-red-700" : "bg-emerald-50 border-emerald-100 text-emerald-800"
        ].join(" ")}>
          <div className="flex-1 text-sm font-medium">{err || msg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-2xl border p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Configuración</h3>
            <div className="space-y-3">
              <label className="text-xs font-medium text-gray-400">Nombre de la Empresa</label>
              <input
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre comercial"
              />
              <button
                className="w-full bg-black text-white rounded-xl py-2.5 text-sm font-medium hover:bg-gray-800 transition-colors"
                type="button"
                onClick={rename}
                disabled={loading}
              >
                Actualizar Nombre
              </button>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold">Miembros de la Organización</h3>
              <p className="text-xs text-gray-500 mt-1">Gestiona roles y acceso individual de usuarios.</p>
            </div>

            <div className="divide-y">
              {members.map((m) => (
                <div key={m.user.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={[
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                      m.user.isDisabled ? "bg-gray-100" : "bg-blue-50"
                    ].join(" ")}>
                      {m.role === "OWNER" ? (
                        <ShieldCheck className="h-5 w-5 text-blue-600" />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                      <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900 truncate">{m.user.name || "Sin nombre"}</p>
                        <span className={[
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          m.role === "OWNER" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                        ].join(" ")}>
                          {m.role}
                        </span>
                        <span className={[
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          m.user.isDisabled ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                        ].join(" ")}>
                          {m.user.isDisabled ? "Bloqueado" : "Activo"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{m.user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {m.role !== "OWNER" && (
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                        onClick={() => updateRole(m.user.id, "OWNER")}
                      >
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Ascender a Owner
                      </button>
                    )}
                    {m.role === "OWNER" && members.filter(x => x.role === "OWNER").length > 1 && (
                       <button
                       className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                       onClick={() => updateRole(m.user.id, "STAFF")}
                     >
                       Degradar a Staff
                     </button>
                    )}
                    
                    <button
                      className={[
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border",
                        m.user.isDisabled 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" 
                          : "bg-red-50 text-red-700 border-red-100 hover:bg-red-100"
                      ].join(" ")}
                      onClick={() => toggleUser(m.user.id, !m.user.isDisabled)}
                    >
                      {m.user.isDisabled ? <UserPlus className="h-3.5 w-3.5" /> : <UserMinus className="h-3.5 w-3.5" />}
                      {m.user.isDisabled ? "Reactivar" : "Inhabilitar"}
                    </button>
                  </div>
                </div>
              ))}
              {!members.length && !loading && (
                <div className="p-12 text-center text-gray-400 text-sm italic">
                  No hay miembros en esta organización.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
