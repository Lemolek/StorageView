export interface ScanProgress {
  filesScanned: number;
  directoriesScanned: number;
  bytesScanned: number;
  currentPath: string;
  elapsedMs: number;
}

export interface FileEntry {
  name: string;
  path: string;
  extension: string;
  sizeBytes: number;
  modifiedMs: number | null;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
}

export interface FileTypeStat {
  extension: string;
  totalBytes: number;
  fileCount: number;
  largestFileBytes: number;
}

export interface AgeBucket {
  label: string;
  fileCount: number;
  totalBytes: number;
}

export interface ScanResult {
  rootPath: string;
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
  permissionErrors: number;
  elapsedMs: number;
  largestFiles: FileEntry[];
  largestDirectories: DirectoryEntry[];
  fileTypes: FileTypeStat[];
  ageDistribution: AgeBucket[];
}

export interface ApiError {
  code: string;
  message: string;
}
