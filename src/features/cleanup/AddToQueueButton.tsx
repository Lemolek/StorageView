import { Check, ListPlus } from "lucide-react";
import { useCleanupStore, type CleanupEntry } from "./cleanupStore";

export function AddToQueueButton({ entry }: { entry: CleanupEntry }) {
  const inQueue = useCleanupStore((store) =>
    store.items.some((item) => item.path === entry.path),
  );
  const addEntries = useCleanupStore((store) => store.addEntries);
  const title = inQueue ? "Already in cleanup queue" : "Add to cleanup queue";

  return (
    <button
      type="button"
      disabled={inQueue}
      onClick={() => void addEntries([entry]).catch(() => undefined)}
      title={title}
      aria-label={title}
      className="rounded-[5px] p-1 text-muted transition-colors duration-(--motion-ms) hover:bg-card-hover hover:text-foreground disabled:pointer-events-none"
    >
      {inQueue ? (
        <Check className="h-4 w-4 text-success" aria-hidden="true" />
      ) : (
        <ListPlus className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
