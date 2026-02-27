"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/app"
    });

    setLoading(false);

    if (res?.error) setError("Credenciales inválidas");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-300 flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="hidden lg:flex flex-col justify-between rounded-2xl border bg-white/30 backdrop-blur p-10 shadow-sm">
          <div>
            <div className="text-sm font-medium text-gray-700">Autopartes SaaS</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
              Inventario y ventas,
              <br />
              rápido y ordenado.
            </h1>
            <p className="mt-3 text-sm text-gray-700 leading-6">
              Controla piezas por vehículo o por stock general, registra ventas y consulta totales en USD y VES.
            </p>
          </div>

          <div className="rounded-xl border bg-white/60 p-4">
            <div className="text-xs text-gray-600">Tip</div>
            <div className="mt-1 text-sm text-gray-800">
              Usa SKU + motor (ej: 4G94) para encontrar piezas rápido.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white/90 backdrop-blur shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500">Bienvenido</div>
                <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
              </div>
              <div className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center font-semibold">
                A
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="tuemail@gmail.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="********"
                  required
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button className="w-full" disabled={loading} type="submit">
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="flex items-center justify-between">
                <Link className="text-sm text-gray-600 hover:underline" href="/register">
                  Crear cuenta
                </Link>
                <span className="text-xs text-gray-500">v0.1</span>
              </div>
            </form>
          </div>

          <div className="px-8 py-5 border-t bg-gray-50">
            <div className="text-xs text-gray-600">
              Si no tienes código o whitelist, pídele al owner que te habilite.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}