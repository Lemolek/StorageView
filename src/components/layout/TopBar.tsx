import { useNavigate } from "react-router-dom";
import { Loader2, Search, Settings } from "lucide-react";
import { openCommandMenu } from "@/components/CommandMenu";
import { useScanStore } from "@/features/storage/scanStore";
import { cn } from "@/lib/utils/cn";

export function TopBar() {
  const navigate = useNavigate();
  const scanning = useScanStore((store) => store.status === "scanning");

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background px-6">
      <button
        type="button"
        onClick={openCommandMenu}
        className={cn(
          "flex h-8 w-96 items-center gap-2 rounded-input border border-border bg-surface px-2.5 text-left text-sm text-muted/70 transition-all duration-(--motion-ms)",
          "hover:border-border-strong hover:text-muted focus-visible:border-primary/70 focus-visible:glow-accent-soft",
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">Search or run a command…</span>
        <kbd className="rounded-[4px] border border-border bg-card px-1.5 py-px text-[10px] tracking-wide text-muted">
          Ctrl K
        </kbd>
      </button>
      <div className="ml-auto flex items-center gap-1.5">
        {scanning ? (
          <span className="flex items-center gap-1.5 rounded-btn border border-primary/40 bg-primary/10 px-2 py-1 text-[11px] font-medium text-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden="true" />
            Scanning
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => navigate("/settings")}
          title="Settings"
          aria-label="Settings"
          className="flex h-8 w-8 items-center justify-center rounded-btn text-muted transition-all duration-(--motion-ms) hover:bg-card-hover hover:text-foreground"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
