"use client";

import { useState, useMemo, useRef, useCallback } from "react";

export function useDebouncedSearch<T extends { id: string }>(
  endpoint: string,
  initialData: T[],
  delay = 300
) {
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [query, setQuery] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const merged = useMemo(() => {
    if (!query.trim()) return initialData;
    const initialIds = new Set(initialData.map((d) => d.id));
    const extras = searchResults.filter((r) => !initialIds.has(r.id));
    return [...initialData, ...extras];
  }, [initialData, searchResults, query]);

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      if (timerRef.current) clearTimeout(timerRef.current);

      if (!q.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(
            `${endpoint}?search=${encodeURIComponent(q)}&limit=20`
          );
          const data = await res.json();
          if (data.success) setSearchResults(data.data);
        } catch {
          /* keep existing results */
        } finally {
          setIsSearching(false);
        }
      }, delay);
    },
    [endpoint, delay]
  );

  return { data: merged, isSearching, handleSearch };
}
