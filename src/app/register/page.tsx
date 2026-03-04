"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const [mode, setMode] = useState<"EMPLOYEE" | "OWNER">("EMPLOYEE");

  const [orgName, setOrgName] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [joinCode, setJoinCode] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const emailNorm = useMemo(() => email.toLowerCase().trim(), [email]);

  const canSubmit = useMemo(() => {
    if (loading) return false;
    if (name.trim().length < 2) return false;
    if (emailNorm.length < 5) return false;
    if (password.length < 8) return false;
    if (mode === "OWNER" && orgName.trim().length < 2) return false;
    return true;
  }, [loading, name, emailNorm, password, mode, orgName]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setLoading(true);

    const payload: any = {
      name: name.trim(),
      email: emailNorm,
      password
    };

    if (mode === "EMPLOYEE") {
      payload.accountType = "EMPLOYEE";
      if (joinCode.trim()) payload.joinCode = joinCode.trim();
    } else {
      payload.accountType = "OWNER";
      payload.orgName = orgName.trim();
    }

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => null);

    setLoading(false);

    if (!res.ok) {
      const msg =
        data?.error === "OWNER_NOT_APPROVED"
          ? "Este email no está aprobado para ser Owner."
          : data?.error === "ORG_NAME_REQUIRED"
          ? "Debes escribir el nombre de la empresa."
          : data?.error === "INVALID_JOIN_CODE"
          ? "Código inválido."
          : data?.error === "JOIN_CODE_EXHAUSTED"
          ? "Código sin cupos."
          : data?.error === "NOT_ALLOWED"
          ? "Este correo no está autorizado."
          : data?.error === "EMAIL_IN_USE"
          ? "Ese email ya está registrado."
          : "No se pudo crear la cuenta.";

      setError(msg);
      return;
    }

    setOk(true);
    setOrgName("");
    setName("");
    setEmail("");
    setPassword("");
    setJoinCode("");
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
              Crea tu cuenta
              <br />
              y empieza hoy.
            </h1>

            <p className="mt-4 text-sm text-gray-800/80 leading-6">
              Empleados: código o whitelist. Owners: pre-aprobación por el admin del SaaS.
            </p>
          </div>

          <div className="rounded-2xl border bg-white/55 p-5">
            <div className="text-sm font-semibold text-gray-900">Autopartes SaaS</div>
            <div className="mt-1 text-xs text-gray-700">Acceso por empresa y roles.</div>
          </div>
        </section>

        <section className="rounded-3xl border bg-white/85 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-gray-500">Registro</div>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Crear cuenta</h2>
                <div className="mt-2 text-sm text-gray-600">Elige tu tipo de cuenta y completa tus datos.</div>
              </div>

              <div className="h-11 w-11 rounded-2xl border bg-white flex items-center justify-center font-semibold text-gray-900 shadow-sm">
                A
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("EMPLOYEE")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  mode === "EMPLOYEE" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
                ].join(" ")}
              >
                Empleado
              </button>

              <button
                type="button"
                onClick={() => setMode("OWNER")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-medium transition",
                  mode === "OWNER" ? "bg-gray-900 text-white border-gray-900" : "bg-white hover:bg-gray-50"
                ].join(" ")}
              >
                Owner
              </button>
            </div>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              {mode === "OWNER" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre de empresa</label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Ej: Autopartes Figueroa" required />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="tuemail@gmail.com" required />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
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

              {mode === "EMPLOYEE" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Código de empresa <span className="ml-2 text-xs text-gray-500">(opcional si estás en whitelist)</span>
                  </label>
                  <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="ABCD-1234" />
                </div>
              ) : (
                <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Para registrarte como Owner debes estar pre-aprobado por el admin del SaaS.
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              ) : null}

              {ok ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Cuenta creada. Ahora puedes{" "}
                  <Link className="underline" href="/login">
                    iniciar sesión
                  </Link>
                  .
                </div>
              ) : null}

              <Button className="w-full rounded-2xl" disabled={!canSubmit} type="submit">
                {loading ? "Creando..." : "Crear cuenta"}
              </Button>

              <div className="flex items-center justify-between pt-1">
                <Link className="text-sm text-gray-600 hover:underline" href="/login">
                  Volver al login
                </Link>
                <span className="text-xs text-gray-500">v0.1</span>
              </div>
            </form>
          </div>

          <div className="px-8 sm:px-10 py-5 border-t bg-gray-50">
            <div className="text-xs text-gray-600">Empleados: código o whitelist. Owners: pre-aprobación.</div>
          </div>
        </section>
      </div>
    </main>
  );
}