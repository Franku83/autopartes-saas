"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  email: string;
  roleToAssign: "OWNER" | "STAFF" | "VIEWER";
  createdAt: string;
};

export default function WhitelistPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [email, setEmail] = useState("");
  const [roleToAssign, setRoleToAssign] = useState<Item["roleToAssign"]>("STAFF");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/org/allowed-emails");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.items ?? []);
  }

  async function add() {
    setError(null);
    const res = await fetch("/api/org/allowed-emails", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, roleToAssign })
    });

    if (!res.ok) {
      setError("No se pudo agregar");
      return;
    }

    setEmail("");
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <h2 className="text-lg font-semibold">Correos autorizados</h2>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          className="border rounded-md px-3 py-2 flex-1"
          placeholder="empleado@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select
          className="border rounded-md px-3 py-2"
          value={roleToAssign}
          onChange={(e) => setRoleToAssign(e.target.value as Item["roleToAssign"])}
        >
          <option value="STAFF">STAFF</option>
          <option value="VIEWER">VIEWER</option>
        </select>

        <button className="rounded-md border px-3 py-2 text-sm font-medium" onClick={add} type="button">
          Agregar
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="border rounded-md overflow-hidden">
        <div className="grid grid-cols-3 gap-2 border-b px-3 py-2 text-sm font-medium">
          <div>Email</div>
          <div>Rol</div>
          <div>Creado</div>
        </div>
        {items.map((it) => (
          <div key={it.id} className="grid grid-cols-3 gap-2 px-3 py-2 text-sm border-b">
            <div className="truncate">{it.email}</div>
            <div>{it.roleToAssign}</div>
            <div>{new Date(it.createdAt).toLocaleDateString()}</div>
          </div>
        ))}
      </div>
    </section>
  );
}