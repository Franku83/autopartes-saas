"use client";

import { useState } from "react";

export default function RegisterPage() {
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ orgName, name, email, password }),
    });

    setLoading(false);

    if (!res.ok) {
      setOk(false);
      setError("No se pudo crear la cuenta");
      return;
    }

    setOk(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Crear cuenta</h1>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="space-y-1">
            <label className="text-sm">Empresa</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Nombre</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Email</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Contraseña</label>
            <input
              className="w-full border rounded-md px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {ok ? (
            <p className="text-sm">
              Cuenta creada. Ahora puedes <a className="underline" href="/login">iniciar sesión</a>.
            </p>
          ) : null}

          <button className="w-full rounded-md px-3 py-2 border font-medium" disabled={loading}>
            {loading ? "Creando..." : "Crear"}
          </button>
        </form>

        <a className="text-sm underline" href="/login">
          Volver al login
        </a>
      </div>
    </main>
  );
}