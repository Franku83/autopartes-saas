"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailNorm = useMemo(() => email.toLowerCase().trim(), [email]);
  const canSubmit = emailNorm.length > 3 && password.length >= 1 && !loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email: emailNorm,
      password,
      redirect: true,
      callbackUrl: "/app"
    });

    setLoading(false);

    if (res?.error) setError("Email o contraseña inválidos.");
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-300 flex items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-white/30 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="hidden lg:flex flex-col justify-between rounded-3xl border bg-white/25 backdrop-blur-xl p-10 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/40 px-3 py-1 text-xs font-medium text-gray-800">
              Autopartes SaaS
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-gray-900">
              Control de inventario
              <br />
              y ventas sin fricción.
            </h1>

            <p className="mt-4 text-sm text-gray-800/80 leading-6">
              Diseñado para ventas de autopartes: por vehículo, por stock general, y con búsqueda rápida.
            </p>
          </div>

          <div className="rounded-2xl border bg-white/55 p-5">
            <div className="text-sm font-semibold text-gray-900">Autopartes SaaS</div>
            <div className="mt-1 text-xs text-gray-700">
              Acceso por código o whitelist. Seguridad por empresa.
            </div>
          </div>
        </section>

        <section className="rounded-3xl border bg-white/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500">Bienvenido</div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
                <div className="mt-2 text-sm text-gray-600">
                  Entra con tu email y contraseña.
                </div>
              </div>

              <div className="h-11 w-11 rounded-2xl border bg-white flex items-center justify-center font-semibold text-gray-900 shadow-sm">
                A
              </div>
            </div>

            <form className="mt-7 space-y-4" onSubmit={onSubmit}>
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
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="********"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <Button className="w-full rounded-2xl" disabled={!canSubmit} type="submit">
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <Link className="text-sm text-gray-600 hover:underline" href="/register">
                  Crear cuenta
                </Link>
                <span className="text-xs text-gray-500">v0.1</span>
              </div>
            </form>
          </div>

          <div className="px-8 sm:px-10 py-5 border-t bg-gray-50">
            <div className="text-xs text-gray-600">
              Si no tienes acceso, pídele al owner que te habilite.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}