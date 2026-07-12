import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "holo-sweep border border-primary/70 bg-elevated text-foreground glow-accent-soft hover:glow-accent",
  secondary:
    "border border-border bg-card text-foreground hover:border-border-strong hover:bg-card-hover",
  ghost: "text-muted hover:bg-card-hover hover:text-foreground",
  danger:
    "border border-danger/60 bg-elevated text-danger hover:border-danger hover:shadow-[0_0_12px_rgba(255,92,116,0.25)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-8 px-3.5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-btn font-medium transition-all duration-(--motion-ms) disabled:pointer-events-none disabled:opacity-40",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}
