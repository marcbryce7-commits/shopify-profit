"use client";

import { useState, useEffect, useCallback } from "react";

interface UseContentResult {
  /** Look up a content key with a fallback default */
  c: (key: string, fallback: string) => string;
  /** Raw key-value map */
  data: Record<string, string>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetch CMS content for a given section (e.g. "landing", "login").
 * Returns a lookup function `c(key, fallback)` that safely returns
 * the DB value or the hardcoded fallback if not yet loaded / not set.
 */
export function useContent(section: string): UseContentResult {
  const [data, setData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/content?section=${section}`);
      if (!res.ok) throw new Error(`Content API error: ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const c = useCallback(
    (key: string, fallback: string) => data[key] ?? fallback,
    [data]
  );

  return { c, data, loading, error, refetch: fetchData };
}
