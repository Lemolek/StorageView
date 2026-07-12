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

const OPEN_EVENT = "storageview:command-menu";

export function openCommandMenu(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

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
    const handleOpen = () => {
      setOpen(true);
      setQuery("");
      setActiveIndex(0);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener(OPEN_EVENT, handleOpen);
    };
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-28">
      <div className="absolute inset-0 bg-black/70" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        style={{
          backgroundColor: `color-mix(in srgb, var(--card) calc(var(--glass-alpha) * 100%), transparent)`,
          backdropFilter: `blur(var(--glass-blur))`,
        }}
        className="dialog-in relative z-10 w-full max-w-lg overflow-hidden rounded-dlg border border-border-strong shadow-[0_0_0_1px_rgba(255,255,255,0.07),0_0_32px_rgba(var(--glow-rgb),0.16)]"
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
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-foreground caret-foreground outline-none placeholder:text-muted/70"
        />
        <ul className="max-h-80 overflow-y-auto p-1.5" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-5 text-center text-xs text-muted">
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
                    "flex w-full items-center gap-2.5 rounded-btn px-2.5 py-1.5 text-left text-[13px] transition-colors duration-100",
                    index === activeIndex
                      ? "bg-primary/12 text-foreground shadow-[inset_2px_0_0_var(--primary)]"
                      : "text-muted",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted/70">
                    {item.hint}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
