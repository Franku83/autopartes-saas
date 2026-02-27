"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type NavItem =
  | { type: "link"; href: string; label: string }
  | { type: "group"; label: string; items: { href: string; label: string }[] };

export default function Sidebar() {
  const pathname = usePathname() || "/app";
  const [collapsed, setCollapsed] = useState(false);

  const nav: NavItem[] = useMemo(
    () => [
      { type: "link", href: "/app", label: "Dashboard" },
      {
        type: "group",
        label: "Inventario",
        items: [
          { href: "/app/inventory", label: "Stock" },
          { href: "/app/vehicles", label: "Vehículos" }
        ]
      },
      {
        type: "group",
        label: "Ventas",
        items: [
          { href: "/app/sales", label: "Nueva venta" },
          { href: "/app/sales", label: "Historial" }
        ]
      },
      { type: "link", href: "/app/settings", label: "Ajustes" }
    ],
    []
  );

  const [open, setOpen] = useState<Record<string, boolean>>({
    Inventario: true,
    Ventas: true
  });

  function isActive(href: string) {
    return pathname === href || (href !== "/app" && pathname.startsWith(href));
  }

  return (
    <aside
      className={[
        "h-screen sticky top-0 border-r bg-white",
        collapsed ? "w-[78px]" : "w-[280px]"
      ].join(" ")}
    >
      <div className="p-4 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-base font-semibold truncate">{collapsed ? "A" : "Autopartes"}</div>
          {!collapsed ? <div className="text-xs text-muted-foreground">Dashboard</div> : null}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed((v) => !v)} type="button">
          ≡
        </Button>
      </div>

      <Separator />

      <nav className="p-2 space-y-1">
        {nav.map((item) => {
          if (item.type === "link") {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center rounded-lg px-3 py-2 text-sm font-medium",
                  active ? "bg-muted" : "hover:bg-muted/50"
                ].join(" ")}
              >
                <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
                {collapsed ? <span className="text-xs">•</span> : null}
              </Link>
            );
          }

          const groupOpen = open[item.label] ?? false;

          return (
            <div key={item.label} className="space-y-1">
              <button
                className={[
                  "w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted/50",
                  groupOpen ? "bg-muted/40" : ""
                ].join(" ")}
                type="button"
                onClick={() => setOpen((s) => ({ ...s, [item.label]: !groupOpen }))}
              >
                <span className={collapsed ? "sr-only" : ""}>{item.label}</span>
                {!collapsed ? <ChevronDown className={groupOpen ? "rotate-180 transition" : "transition"} size={16} /> : null}
                {collapsed ? <span className="text-xs">•</span> : null}
              </button>

              {groupOpen && !collapsed ? (
                <div className="pl-2 space-y-1">
                  {item.items.map((sub) => {
                    const active = isActive(sub.href);
                    return (
                      <Link
                        key={sub.href + sub.label}
                        href={sub.href}
                        className={[
                          "block rounded-lg px-3 py-2 text-sm",
                          active ? "bg-muted" : "hover:bg-muted/50"
                        ].join(" ")}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="p-3 mt-auto">
          <div className="rounded-xl border p-3">
            <div className="text-xs text-muted-foreground">Acceso rápido</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link className="text-sm underline" href="/app/sales">
                Vender
              </Link>
              <Link className="text-sm underline" href="/app/inventory">
                Stock
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}