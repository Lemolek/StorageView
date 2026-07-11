import { cn } from "@/lib/utils/cn";

type ProgressTone = "primary" | "success" | "warning" | "danger";

interface ProgressBarProps {
  value: number;
  tone?: ProgressTone;
  className?: string;
}

const toneClasses: Record<ProgressTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({ value, tone = "primary", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 overflow-hidden rounded-full bg-border", className)}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-200", toneClasses[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
