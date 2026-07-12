import { cn } from "@/lib/utils/cn";

export interface TabDefinition<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: readonly TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  label: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, label }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="mb-5 inline-flex gap-0.5 rounded-btn border border-border bg-surface p-0.5"
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          role="tab"
          type="button"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "rounded-[5px] px-3 py-1.5 text-xs font-medium transition-all duration-(--motion-ms)",
            active === tab.id
              ? "bg-card text-foreground shadow-[inset_0_-1px_0_var(--primary)]"
              : "text-muted hover:text-foreground",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
