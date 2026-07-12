export type BrowseEntryKind = "file" | "folder";

export interface BrowseEntry {
  name: string;
  path: string;
  kind: BrowseEntryKind;
  sizeBytes: number;
  fileCount: number | null;
  modifiedMs: number | null;
  percentOfParent: number;
}

export interface BrowseListing {
  path: string;
  parentPath: string | null;
  totalBytes: number;
  entries: BrowseEntry[];
}
