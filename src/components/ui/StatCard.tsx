import type { ReactNode } from "react";
import { Card } from "./Card";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 truncate text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 truncate text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
