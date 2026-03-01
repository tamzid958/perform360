"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

interface ImpersonationBannerProps {
  adminEmail: string;
  companyId: string;
}

export function ImpersonationBanner({ adminEmail, companyId }: ImpersonationBannerProps) {
  const router = useRouter();
  const [ending, setEnding] = useState(false);

  async function handleEnd() {
    setEnding(true);
    try {
      await fetch(`/api/admin/impersonate/${companyId}`, { method: "DELETE" });
      router.push("/superadmin/companies");
      router.refresh();
    } catch {
      setEnding(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500 px-4 py-2 text-[13px] font-medium text-white">
      <span>
        Impersonating <strong>{adminEmail}</strong>
      </span>
      <button
        onClick={handleEnd}
        disabled={ending}
        className="flex items-center gap-1 rounded-md bg-white/20 px-2.5 py-1 text-[12px] font-medium hover:bg-white/30 transition-colors disabled:opacity-50"
      >
        <X size={12} strokeWidth={2} />
        {ending ? "Ending…" : "End Session"}
      </button>
    </div>
  );
}
