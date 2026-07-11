import { useCallback, useEffect, useState } from "react";
import { isDesktopRuntime } from "@/lib/api/app";
import { listDisks } from "@/lib/api/system";
import type { DiskInfo } from "@/types/storage";

interface UseDisksResult {
  disks: DiskInfo[] | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDisks(): UseDisksResult {
  const [disks, setDisks] = useState<DiskInfo[] | null>(null);
  const [loading, setLoading] = useState(isDesktopRuntime());
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isDesktopRuntime()) {
      return;
    }
    setLoading(true);
    try {
      setDisks(await listDisks());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { disks, loading, error, refresh };
}
