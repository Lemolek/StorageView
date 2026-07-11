import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function NotFoundPage() {
  return (
    <>
      <PageHeader
        title="Page not found"
        description="The requested view does not exist."
      />
      <EmptyState
        icon={SearchX}
        title="Nothing here"
        description="Use the sidebar to navigate to an available section."
      />
    </>
  );
}
