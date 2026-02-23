"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      className="rounded-md border px-3 py-2 text-sm font-medium"
      onClick={() => signOut({ callbackUrl: "/login" })}
      type="button"
    >
      Salir
    </button>
  );
}