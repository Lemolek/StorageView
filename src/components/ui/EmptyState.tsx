import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface px-8 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
        <Icon className="h-5 w-5 text-muted" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-base font-medium">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted">{description}</p>
    </div>
  );
}
