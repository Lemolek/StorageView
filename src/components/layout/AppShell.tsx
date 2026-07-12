import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { CommandMenu } from "@/components/CommandMenu";
import { useScanStore } from "@/features/storage/scanStore";
import { isDesktopRuntime } from "@/lib/api/app";
import { onScanProgress } from "@/lib/api/scanning";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

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
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] p-6">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu />
    </div>
  );
}
