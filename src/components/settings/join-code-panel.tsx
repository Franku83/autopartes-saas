"use client";

import { useEffect, useState } from "react";

type Status = {
  hasActiveCode: boolean;
  uses: number;
  maxUses: number | null;
  expiresAt: string | null;
};

export default function JoinCodePanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/org/join-code/status");
    if (!res.ok) return;
    setStatus(await res.json());
  }

  async function rotate() {
    setError(null);
    setNewCode(null);

    const res = await fetch("/api/org/join-code/rotate", { method: "POST" });
    if (!res.ok) {
      setError("No autorizado o error");
      return;
    }
    const data = await res.json();
    setNewCode(data.joinCode);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Código de empresa</h2>
        <button className="rounded-md border px-3 py-2 text-sm font-medium" onClick={rotate} type="button">
          Rotar código
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {newCode ? (
        <div className="rounded-md border p-3">
          <div className="text-sm text-gray-600">Nuevo código (cópialo ahora)</div>
          <div className="mt-1 text-xl font-semibold">{newCode}</div>
        </div>
      ) : null}

      <div className="text-sm text-gray-600">
        {status?.hasActiveCode ? "Hay un código activo." : "No hay código activo."} Usos: {status?.uses ?? 0}
      </div>
    </section>
  );
}