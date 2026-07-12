import {
  FileText,
  HardDrive,
  LayoutDashboard,
  Package,
  Search,
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
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Storage", path: "/storage", icon: HardDrive },
  { label: "Search", path: "/search", icon: Search },
  { label: "Applications", path: "/applications", icon: Package },
  { label: "Cleanup", path: "/cleanup", icon: Trash2 },
  { label: "Reports", path: "/reports", icon: FileText },
  { label: "Settings", path: "/settings", icon: Settings },
];
