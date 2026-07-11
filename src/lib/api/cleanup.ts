import { invoke } from "@tauri-apps/api/core";
import type {
  CleanupReport,
  CleanupSuggestion,
  RiskAssessment,
} from "@/types/cleanup";

export function suggestCleanup(): Promise<CleanupSuggestion[]> {
  return invoke<CleanupSuggestion[]>("suggest_cleanup");
}

export function classifyPaths(paths: string[]): Promise<RiskAssessment[]> {
  return invoke<RiskAssessment[]>("classify_paths", { paths });
}

export function executeCleanup(
  items: { path: string; sizeBytes: number }[],
  permanent: boolean,
): Promise<CleanupReport> {
  return invoke<CleanupReport>("execute_cleanup", { items, permanent });
}
