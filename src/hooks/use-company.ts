"use client";

import { useState, useEffect } from "react";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
}

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const data = await res.json();
          setCompany(data.data);
        }
      } catch {
        // Silently fail - company will be null
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompany();
  }, []);

  return { company, isLoading };
}
