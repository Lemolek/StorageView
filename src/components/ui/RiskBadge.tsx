import { cn } from "@/lib/utils/cn";
import type { RiskLevel } from "@/types/cleanup";

const riskStyles: Record<RiskLevel, string> = {
  safe: "border-success/40 text-success",
  moderate: "border-warning/40 text-warning",
  high: "border-danger/40 text-danger",
  critical: "border-danger/70 bg-danger/15 text-danger",
};

const riskLabels: Record<RiskLevel, string> = {
  safe: "Safe",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

export function RiskBadge({ level, reason }: { level: RiskLevel; reason?: string }) {
  return (
    <span
      title={reason}
      className={cn(
        "inline-flex whitespace-nowrap rounded-[4px] border px-1.5 py-px text-[10px] font-medium uppercase tracking-wide",
        riskStyles[level],
      )}
    >
      {riskLabels[level]}
    </span>
  );
}
