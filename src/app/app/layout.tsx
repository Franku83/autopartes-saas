import Link from "next/link";
import LogoutButton from "@/components/logout-button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr]">
      <aside className="border-r p-4">
        <div className="text-lg font-semibold">Autopartes</div>

        <nav className="mt-6 space-y-1">
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app">
            Dashboard
          </Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app/vehicles">
            Vehículos
          </Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app/inventory">
            Inventario
          </Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app/sales">
            Ventas
          </Link>
          <Link className="block rounded-md px-3 py-2 hover:bg-gray-100" href="/app/settings">
            Ajustes
          </Link>
        </nav>
      </aside>

      <div className="flex flex-col">
        <header className="border-b p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">Panel</div>
          <LogoutButton />
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}