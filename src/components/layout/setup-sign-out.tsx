"use client";

import { signOut } from "next-auth/react";

export function SetupSignOut() {
  return (
    <button
      onClick={() => signOut({ redirectTo: "/login" })}
      className="text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
    >
      Sign out
    </button>
  );
}
