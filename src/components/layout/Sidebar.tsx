import { NavLink } from "react-router-dom";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { navItems } from "@/app/navigation";
import { useScanStore } from "@/features/storage/scanStore";
import { useAppInfo } from "@/hooks/useAppInfo";
import { cn } from "@/lib/utils/cn";
import brandIcon from "../../../assets/brand/diskscope-icon.svg";

export function Sidebar() {
  const { theme, toggleTheme } = useTheme();
  const appInfo = useAppInfo();
  const scanning = useScanStore((store) => store.status === "scanning");
  const filesScanned = useScanStore(
    (store) => store.progress?.filesScanned ?? 0,
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-3 px-5 py-5">
        <img src={brandIcon} alt="DiskScope" className="h-9 w-9 rounded-lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight">DiskScope</p>
          <p className="truncate text-xs text-muted">Advanced Storage Analyzer</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-card text-foreground"
                  : "text-muted hover:bg-card/60 hover:text-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {scanning ? (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-xs text-muted">
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-primary"
            aria-hidden="true"
          />
          Scanning… {filesScanned.toLocaleString()} files
        </div>
      ) : null}
      <div className="border-t border-border px-5 py-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-1 py-2 text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Moon className="h-4 w-4" aria-hidden="true" />
          )}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <p className="mt-2 text-xs text-muted">
          Created by Lemolek
          {appInfo ? ` · v${appInfo.version}` : ""}
        </p>
      </div>
    </aside>
  );
}
