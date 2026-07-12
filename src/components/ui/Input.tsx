import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-8 rounded-input border border-border bg-background px-2.5 text-sm text-foreground caret-foreground outline-none transition-all duration-(--motion-ms) placeholder:text-muted/70 focus:border-primary/70 focus:glow-accent-soft",
        className,
      )}
      {...props}
    />
  );
}
