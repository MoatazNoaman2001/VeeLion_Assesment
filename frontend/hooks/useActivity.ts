"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useApiResource } from "@/hooks/useApiResource";
import type { ActivityLog } from "@/types/api";

function searchableText(value: unknown) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function newestFirst(a: ActivityLog, b: ActivityLog) {
  return (Date.parse(b.when) || 0) - (Date.parse(a.when) || 0);
}

function matchesQuery(entry: ActivityLog, query: string) {
  return searchableText(entry.action).includes(query) || searchableText(entry.info).includes(query);
}

export function useActivity() {
  const { data, error, loading, reload } = useApiResource<ActivityLog[]>(
    "/api/activity",
    "Could not load activity right now."
  );
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const entries = useMemo(() => (data ? [...data].sort(newestFirst) : []), [data]);

  const visibleEntries = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    return normalizedQuery ? entries.filter((entry) => matchesQuery(entry, normalizedQuery)) : entries;
  }, [entries, deferredQuery]);

  return {
    hasLoaded: data !== null,
    entries,
    visibleEntries,
    query,
    setQuery,
    error,
    loading,
    reload,
  };
}
