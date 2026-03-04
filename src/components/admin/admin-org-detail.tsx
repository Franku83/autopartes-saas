"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    load();
  }, [orgId]);

  if (!orgId) {
    return (
      <div className="space-y-4">
        <Link className="text-sm underline" href="/admin">
          Volver
        </Link>

        <div className="rounded-xl border bg-red-50 px-4 py-3 text-sm text-red-700">
          No se recibió orgId en la ruta.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link className="text-sm underline" href="/admin">
            Volver
          </Link>

          <h1 className="text-2xl font-semibold mt-2 truncate">{org?.name ?? "Organización"}</h1>
          <div className="text-xs text-gray-500 truncate">{orgId}</div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border",
              org?.status === "ACTIVE"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            ].join(" ")}
          >
            {org?.status ?? "—"}
          </span>

          {org?.status === "ACTIVE" ? (
            <button
              className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
              type="button"
              onClick={() => setOrgStatus("SUSPENDED")}
            >
              Suspender
            </button>
          ) : (
            <button
              className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
              type="button"
              onClick={() => setOrgStatus("ACTIVE")}
            >
              Activar
            </button>
          )}
        </div>
      </div>

      {loading ? <div className="text-sm text-gray-600">Cargando…</div> : null}

      {err ? (
        <div className="rounded-xl border bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      {msg ? (
        <div className="rounded-xl border bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {msg}
        </div>
      ) : null}

      <section className="rounded-2xl border bg-white p-5 space-y-3">
        <div className="text-sm font-medium">Renombrar empresa</div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="border rounded-xl px-3 py-2 flex-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre de la empresa"
          />

          <button
            className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            type="button"
            onClick={rename}
          >
            Guardar
          </button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="text-sm font-medium">Usuarios</div>
          <div className="text-sm text-gray-600 mt-1">
            Puedes desactivar un usuario para bloquear su login.
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 border-b px-5 py-3 text-sm font-medium">
          <div className="col-span-4">Email</div>
          <div className="col-span-3">Nombre</div>
          <div className="col-span-2">Rol</div>
          <div className="col-span-1">Estado</div>
          <div className="col-span-2">Acción</div>
        </div>

        {members.map((m) => (
          <div key={m.user.id} className="grid grid-cols-12 gap-2 px-5 py-3 text-sm border-b items-center">
            <div className="col-span-4 truncate">{m.user.email}</div>
            <div className="col-span-3 truncate">{m.user.name ?? "—"}</div>
            <div className="col-span-2">{m.role}</div>
            <div className="col-span-1">{m.user.isDisabled ? "OFF" : "ON"}</div>
            <div className="col-span-2">
              {m.user.isDisabled ? (
                <button
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  type="button"
                  onClick={() => toggleUser(m.user.id, false)}
                >
                  Activar
                </button>
              ) : (
                <button
                  className="rounded-xl border px-3 py-2 text-xs font-medium hover:bg-gray-50"
                  type="button"
                  onClick={() => toggleUser(m.user.id, true)}
                >
                  Desactivar
                </button>
              )}
            </div>
          </div>
        ))}

        {!members.length && !loading ? (
          <div className="px-5 py-6 text-sm text-gray-600">Sin miembros.</div>
        ) : null}
      </section>
    </div>
  );
}