import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-8 rounded-input border border-border bg-background px-2 text-sm text-foreground outline-none transition-all duration-(--motion-ms) focus:border-primary/70 focus:glow-accent-soft",
        className,
      )}
      {...props}
    />
  );
}
