export interface DiskInfo {
  name: string;
  mountPoint: string;
  fileSystem: string;
  kind: string;
  totalBytes: number;
  availableBytes: number;
  removable: boolean;
}
