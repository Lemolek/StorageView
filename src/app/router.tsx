import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ApplicationsPage } from "@/pages/ApplicationsPage";
import { CleanupPage } from "@/pages/CleanupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SearchPage } from "@/pages/SearchPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StoragePage } from "@/pages/StoragePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "storage", element: <StoragePage /> },
      { path: "search", element: <SearchPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "cleanup", element: <CleanupPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
