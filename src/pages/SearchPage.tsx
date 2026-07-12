import { Search } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function SearchPage() {
  return (
    <>
      <PageHeader
        title="Search"
        description="Find files and folders by name, size, type and dates."
      />
      <EmptyState
        icon={Search}
        title="Search is being prepared"
        description="Filesystem search with filters and streaming results will be available here."
      />
    </>
  );
}
