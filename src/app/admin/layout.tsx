import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await requireUser();

  const me = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true }
  });

  if (!me || me.globalRole !== "SUPERADMIN") {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold">Acceso denegado</h1>
        <p className="mt-2">No tienes permisos para ver el panel admin.</p>
        <Link className="underline mt-4 inline-block" href="/app">
          Volver
        </Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r p-4">
        <div className="text-lg font-semibold">Admin</div>
        <nav className="mt-6 space-y-1">
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/admin">
            Organizaciones
          </Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app">
            Volver al panel
          </Link>
        </nav>
      </aside>

      <div className="flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Panel Admin</div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}