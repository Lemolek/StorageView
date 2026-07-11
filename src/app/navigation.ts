import {
  BarChart3,
  FileText,
  FolderSearch,
  HardDrive,
  LayoutDashboard,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Storage", path: "/storage", icon: HardDrive },
  { label: "Explorer", path: "/explorer", icon: FolderSearch },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Cleanup", path: "/cleanup", icon: Trash2 },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];
