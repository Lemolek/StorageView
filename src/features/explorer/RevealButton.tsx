import { FolderOpen } from "lucide-react";
import { revealPath } from "@/lib/api/system";

export function RevealButton({ path, title }: { path: string; title: string }) {
  return (
    <button
      type="button"
      onClick={() => void revealPath(path).catch(() => undefined)}
      title={title}
      aria-label={title}
      className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-surface hover:text-foreground"
    >
      <FolderOpen className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
