import type { BrowseEntryKind } from "./browse";

export type SearchScope = "all" | "files" | "folders";

export interface SearchQuery {
  root: string;
  scope: SearchScope;
  text: string;
  useRegex: boolean;
  extensions: string[];
  minSizeBytes: number | null;
  maxSizeBytes: number | null;
  modifiedAfterMs: number | null;
  modifiedBeforeMs: number | null;
  createdAfterMs: number | null;
  createdBeforeMs: number | null;
  includeHidden: boolean;
  limit: number;
}

export interface SearchHit {
  name: string;
  path: string;
  kind: BrowseEntryKind;
  sizeBytes: number;
  modifiedMs: number | null;
}

export interface SearchSummary {
  totalHits: number;
  truncated: boolean;
  elapsedMs: number;
}
