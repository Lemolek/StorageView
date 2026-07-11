import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderSearch, SunMoon, type LucideIcon } from "lucide-react";
import { navItems } from "@/app/navigation";
import { useTheme } from "@/app/providers/ThemeProvider";
import { useScanStore } from "@/features/storage/scanStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { isDesktopRuntime } from "@/lib/api/app";
import { selectFolder } from "@/lib/api/dialog";
import { cn } from "@/lib/utils/cn";

interface CommandItem {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  run: () => void;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const startScan = useScanStore((store) => store.startScan);
  const defaultScanLocation = useSettingsStore(
    (store) => store.defaultScanLocation,
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        setQuery("");
        setActiveIndex(0);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  const close = () => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  const items = useMemo<CommandItem[]>(() => {
    const pageItems = navItems.map((item) => ({
      id: `page:${item.path}`,
      label: item.label,
      hint: "Go to page",
      icon: item.icon,
      run: () => navigate(item.path),
    }));
    const actionItems: CommandItem[] = [
      {
        id: "action:scan-folder",
        label: "Scan a folder…",
        hint: "Action",
        icon: FolderSearch,
        run: () => {
          if (!isDesktopRuntime()) {
            return;
          }
          void selectFolder(defaultScanLocation).then((folder) => {
            if (folder) {
              void startScan(folder);
              navigate("/storage");
            }
          });
        },
      },
      {
        id: "action:toggle-theme",
        label: "Toggle theme",
        hint: "Action",
        icon: SunMoon,
        run: toggleTheme,
      },
    ];
    return [...actionItems, ...pageItems];
  }, [navigate, toggleTheme, startScan, defaultScanLocation]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items;
    }
    return items.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [items, query]);

  const runItem = (item: CommandItem | undefined) => {
    if (!item) {
      return;
    }
    close();
    item.run();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-24">
      <div className="absolute inset-0 bg-black/60" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xl"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setActiveIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              runItem(filtered[activeIndex]);
            }
          }}
          placeholder="Type a command or page name…"
          className="w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted"
        />
        <ul className="max-h-80 overflow-y-auto p-2" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted">
              No matching commands.
            </li>
          ) : (
            filtered.map((item, index) => (
              <li key={item.id} role="option" aria-selected={index === activeIndex}>
                <button
                  type="button"
                  onClick={() => runItem(item)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors duration-100",
                    index === activeIndex
                      ? "bg-surface text-foreground"
                      : "text-muted",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-xs text-muted">{item.hint}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
