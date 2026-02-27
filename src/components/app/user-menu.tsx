"use client";

import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function UserMenu() {
  const { data } = useSession();
  const email = data?.user?.email ?? "";
  const name = (data?.user as any)?.name ?? "";
  const label = name ? name : email;
  const initial = (email[0] ?? "U").toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-muted/50">
        <Avatar className="h-7 w-7">
          <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
        <div className="text-sm font-medium max-w-[180px] truncate">{label || "Usuario"}</div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>Salir</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}