import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="card-edge flex flex-col items-center justify-center rounded-panel border border-border bg-surface px-8 py-12 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-card border border-border bg-card">
        <Icon className="h-4 w-4 text-muted" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-sm font-medium text-foreground">{title}</h2>
      <p className="mt-1 max-w-md text-xs text-muted">{description}</p>
    </div>
  );
}
