import { NavLink, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { navItems } from "@/app/navigation";
import { useScanStore } from "@/features/storage/scanStore";
import { HOLO_ID, LIGHT_ID } from "@/lib/theme/themes";
import { useAppInfo } from "@/hooks/useAppInfo";
import { cn } from "@/lib/utils/cn";
import brandIcon from "../../../assets/brand/storageview-icon.svg";

const ITEM_HEIGHT = 34;
const ITEM_GAP = 2;

export function Sidebar() {
  const { activeTheme, setActiveTheme } = useTheme();
  const appInfo = useAppInfo();
  const location = useLocation();
  const scanning = useScanStore((store) => store.status === "scanning");
  const filesScanned = useScanStore(
    (store) => store.progress?.filesScanned ?? 0,
  );

  const activeIndex = navItems.findIndex((item) =>
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.path),
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <img src={brandIcon} alt="StorageView" className="h-8 w-8 rounded-[6px]" />
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tracking-tight text-foreground">
            StorageView
          </p>
          <p className="truncate text-[10px] tracking-wide text-muted/80">
            Analyze. Visualize. Optimize.
          </p>
        </div>
      </div>
      <nav className="relative flex-1 px-3 py-2" aria-label="Primary">
        {activeIndex >= 0 ? (
          <span
            aria-hidden="true"
            className="absolute left-3 w-[2px] rounded-full bg-primary shadow-[0_0_8px_rgba(var(--glow-rgb),0.9)] transition-transform duration-(--motion-ms) ease-out"
            style={{
              height: ITEM_HEIGHT - 12,
              top: 8 + 6,
              transform: `translateY(${activeIndex * (ITEM_HEIGHT + ITEM_GAP)}px)`,
            }}
          />
        ) : null}
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                cn(
                  "group relative flex h-[34px] items-center gap-2.5 overflow-hidden rounded-btn px-3 text-[13px] font-medium transition-colors duration-(--motion-ms)",
                  isActive
                    ? "bg-gradient-to-r from-primary/15 to-transparent text-foreground"
                    : "text-muted hover:bg-elevated hover:text-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors duration-(--motion-ms)",
                      isActive ? "text-primary" : "text-muted/80 group-hover:text-muted",
                    )}
                    aria-hidden="true"
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
      {scanning ? (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-btn border border-border bg-card px-2.5 py-1.5 text-[11px] text-muted">
          <Loader2
            className="h-3 w-3 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          Scanning… {filesScanned.toLocaleString()} files
        </div>
      ) : null}
      <div className="border-t border-border px-4 py-3">
        <div className="flex gap-1">
          {[
            { id: HOLO_ID, label: "Holo" },
            { id: LIGHT_ID, label: "Light" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActiveTheme(option.id)}
              aria-pressed={activeTheme.id === option.id}
              className={cn(
                "flex-1 rounded-[5px] border px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-all duration-(--motion-ms)",
                activeTheme.id === option.id
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-border text-muted hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[10px] leading-relaxed text-muted/70">
          {appInfo ? `v${appInfo.version} · ` : ""}© 2026 Lemolek. All rights
          reserved.
        </p>
      </div>
    </aside>
  );
}
