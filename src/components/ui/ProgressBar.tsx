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

const headShadow: Record<ProgressTone, string> = {
  primary: "0 0 6px rgba(var(--glow-rgb), 0.9)",
  success: "0 0 6px rgba(53, 208, 127, 0.8)",
  warning: "0 0 6px rgba(240, 180, 76, 0.8)",
  danger: "0 0 6px rgba(255, 92, 116, 0.8)",
};

export function ProgressBar({ value, tone = "primary", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-1.5 overflow-hidden rounded-full border border-border/60 bg-background",
        className,
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-(--motion-ms) ease-out",
          toneClasses[tone],
        )}
        style={{
          width: `${clamped}%`,
          boxShadow: clamped > 2 ? headShadow[tone] : undefined,
        }}
      />
    </div>
  );
}
