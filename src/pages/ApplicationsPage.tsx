import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

export function ApplicationsPage() {
  return (
    <>
      <PageHeader
        title="Applications"
        description="Installed applications with size, uninstall and leftover analysis."
      />
      <EmptyState
        icon={Package}
        title="Application discovery is being prepared"
        description="Installed application inventory and conservative leftover cleanup will be available here."
      />
    </>
  );
}
