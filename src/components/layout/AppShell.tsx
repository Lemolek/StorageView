import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { CommandMenu } from "@/components/CommandMenu";
import { useScanStore } from "@/features/storage/scanStore";
import { isDesktopRuntime } from "@/lib/api/app";
import { onScanProgress } from "@/lib/api/scanning";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  useEffect(() => {
    if (!isDesktopRuntime()) {
      return;
    }
    const subscription = onScanProgress((progress) =>
      useScanStore.getState().updateProgress(progress),
    );
    return () => {
      void subscription.then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-8 py-8">
          <Outlet />
        </div>
      </main>
      <CommandMenu />
    </div>
  );
}
