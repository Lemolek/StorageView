import { useEffect, useState } from "react";
import { getAppInfo, isDesktopRuntime } from "@/lib/api/app";
import type { AppInfo } from "@/types/app";

export function useAppInfo(): AppInfo | null {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    if (!isDesktopRuntime()) {
      return;
    }
    let active = true;
    getAppInfo()
      .then((info) => {
        if (active) {
          setAppInfo(info);
        }
      })
      .catch(() => {
        if (active) {
          setAppInfo(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return appInfo;
}
