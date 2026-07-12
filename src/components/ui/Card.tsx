import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ className, interactive = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "card-edge rounded-card border border-border bg-card p-4",
        interactive &&
          "transition-colors duration-(--motion-ms) hover:border-border-strong hover:bg-card-hover",
        className,
      )}
      {...props}
    />
  );
}
