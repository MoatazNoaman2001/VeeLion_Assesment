"use client";

import { useCallback, useEffect, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";

export function useApiResource<T>(url: string, errorFallback: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    requestJson<T>(url, { signal: controller.signal })
      .then((body) => {
        if (!controller.signal.aborted) {
          setData(body);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(getErrorMessage(requestError, errorFallback));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [url, errorFallback, reloadKey]);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  return { data, setData, error, loading, reload };
}
