import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { CleanupPage } from "@/pages/CleanupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExplorerPage } from "@/pages/ExplorerPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StoragePage } from "@/pages/StoragePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "storage", element: <StoragePage /> },
      { path: "explorer", element: <ExplorerPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "cleanup", element: <CleanupPage /> },
      { path: "reports", element: <ReportsPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
