import type { BrowseEntryKind } from "./browse";

export interface InstalledApp {
  id: string;
  name: string;
  publisher: string | null;
  version: string | null;
  installLocation: string | null;
  estimatedSizeBytes: number | null;
  uninstallCommand: string | null;
  quietUninstallCommand: string | null;
  source: string;
  installDateMs: number | null;
}

export type LeftoverConfidence = "high" | "medium" | "low";

export interface LeftoverCandidate {
  path: string;
  kind: BrowseEntryKind;
  sizeBytes: number;
  confidence: LeftoverConfidence;
  source: string;
}

export interface RecycleBinSummary {
  itemCount: number;
  totalBytes: number;
}
