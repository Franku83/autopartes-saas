"use client";

import Providers from "@/components/providers";
import { Input } from "@/components/ui/input";
import UserMenu from "@/components/app/user-menu";

export default function Topbar({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <header className="border-b bg-white">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Panel</div>
            <div className="text-lg font-semibold truncate">Autopartes</div>
            <div className="text-sm text-muted-foreground truncate">Gestión de inventario y ventas</div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block w-[320px]">
              <Input placeholder="Buscar SKU, pieza, motor..." />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      {children}
    </Providers>
  );
}