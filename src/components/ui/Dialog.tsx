import { useEffect, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export function Dialog({ open, title, onClose, children, footer }: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          backgroundColor: `color-mix(in srgb, var(--card) calc(var(--glass-alpha) * 100%), transparent)`,
          backdropFilter: `blur(var(--glass-blur))`,
        }}
        className="dialog-in relative z-10 w-full max-w-md rounded-dlg border border-border-strong p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_28px_rgba(var(--glow-rgb),0.14)]"
      >
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        <div className="mt-2.5 text-sm text-muted">{children}</div>
        {footer ? <div className="mt-5 flex justify-end gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
