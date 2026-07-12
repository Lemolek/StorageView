import { FolderOpen } from "lucide-react";
import { revealPath } from "@/lib/api/system";

export function RevealButton({ path, title }: { path: string; title: string }) {
  return (
    <button
      type="button"
      onClick={() => void revealPath(path).catch(() => undefined)}
      title={title}
      aria-label={title}
      className="rounded-[5px] p-1 text-muted transition-colors duration-(--motion-ms) hover:bg-card-hover hover:text-foreground"
    >
      <FolderOpen className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
