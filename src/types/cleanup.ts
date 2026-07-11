export type RiskLevel = "safe" | "moderate" | "high" | "critical";

export interface RiskAssessment {
  riskLevel: RiskLevel;
  reason: string;
  protected: boolean;
}

export type CleanupItemKind = "file" | "folder";

export interface CleanupItem {
  path: string;
  name: string;
  kind: CleanupItemKind;
  sizeBytes: number;
  riskLevel: RiskLevel;
  reason: string;
  protected: boolean;
}

export interface CleanupItemOutcome {
  path: string;
  success: boolean;
  error: string | null;
}

export interface CleanupReport {
  requested: number;
  succeeded: number;
  failed: number;
  bytesRecovered: number;
  permanent: boolean;
  outcomes: CleanupItemOutcome[];
}

export interface CleanupSuggestion {
  label: string;
  path: string;
  category: string;
  sizeBytes: number;
  riskLevel: RiskLevel;
  reason: string;
}

export interface DuplicateFile {
  name: string;
  path: string;
  modifiedMs: number | null;
}

export interface DuplicateGroup {
  sizeBytes: number;
  fileCount: number;
  wastedBytes: number;
  files: DuplicateFile[];
}

export interface DuplicateProgress {
  phase: "collecting" | "hashing";
  filesSeen: number;
  hashed: number;
  totalCandidates: number;
  currentPath: string;
}
