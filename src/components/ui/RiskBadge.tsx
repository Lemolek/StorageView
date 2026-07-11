import { cn } from "@/lib/utils/cn";
import type { RiskLevel } from "@/types/cleanup";

const riskStyles: Record<RiskLevel, string> = {
  safe: "bg-success/15 text-success",
  moderate: "bg-warning/15 text-warning",
  high: "bg-danger/15 text-danger",
  critical: "bg-danger/30 text-danger",
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
        "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
        riskStyles[level],
      )}
    >
      {riskLabels[level]}
    </span>
  );
}
