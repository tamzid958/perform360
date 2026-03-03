"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { signOut } from "next-auth/react";
import { Building2, LogOut } from "lucide-react";

interface CompanyOption {
  companyId: string;
  companyName: string;
  companySlug: string;
  companyLogo: string | null;
  role: string;
}

export default function SelectCompanyPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);

  const selectCompany = useCallback(async (companyId: string) => {
    setSelecting(companyId);
    try {
      const res = await fetch("/api/auth/select-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const json = await res.json();
      if (json.success) {
        router.push("/overview");
        return;
      }
    } catch {
      // Ignore and let user retry
    }
    setSelecting(null);
  }, [router]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/companies");
      const json = await res.json();
      if (json.success) {
        const list: CompanyOption[] = json.data;

        if (list.length === 1) {
          await selectCompany(list[0].companyId);
          return;
        }

        setCompanies(list);
      }
    } catch {
      // If fetch fails, stay on page
    } finally {
      setLoading(false);
    }
  }, [selectCompany]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const roleBadgeVariant = (role: string) => {
    if (role === "ADMIN") return "info" as const;
    if (role === "HR") return "success" as const;
    return "default" as const;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <Image src="/logo.png" alt="Performs360" width={160} height={30} className="h-8 w-auto mx-auto" />
        <h1 className="text-[22px] font-semibold text-gray-900">
          Select a company
        </h1>
        <p className="text-[14px] text-gray-500">
          Choose which organization you&apos;d like to access
        </p>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200/60"
            >
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
          ))
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-[14px] text-gray-500">
            No companies found for your account.
          </div>
        ) : (
          companies.map((company) => (
            <button
              key={company.companyId}
              onClick={() => selectCompany(company.companyId)}
              disabled={selecting !== null}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-200/60 hover:border-brand-300 hover:shadow-sm transition-all duration-200 text-left disabled:opacity-60"
            >
              {company.companyLogo ? (
                <Image
                  src={company.companyLogo}
                  alt={company.companyName}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl object-cover bg-gray-100"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Building2
                    size={24}
                    strokeWidth={1.5}
                    className="text-gray-400"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-gray-900 truncate">
                  {company.companyName}
                </p>
                <p className="text-[13px] text-gray-400 truncate">
                  {company.companySlug}
                </p>
              </div>
              <Badge variant={roleBadgeVariant(company.role)}>
                {company.role}
              </Badge>
              {selecting === company.companyId && (
                <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              )}
            </button>
          ))
        )}
      </div>

      <div className="text-center">
        <button
          onClick={() => signOut({ redirectTo: "/login" })}
          className="inline-flex items-center gap-2 text-[13px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );
}
