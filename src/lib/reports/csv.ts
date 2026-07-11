import type { ScanResult } from "@/types/scan";

export function csvEscape(value: string | number | null | undefined): string {
  if (value == null) {
    return "";
  }
  const text = String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\r\n");
}

export function buildScanReportCsv(result: ScanResult): string {
  const rows: (string | number | null | undefined)[][] = [
    ["StorageView Scan Report"],
    ["Root path", result.rootPath],
    ["Total files", result.totalFiles],
    ["Total directories", result.totalDirectories],
    ["Total bytes", result.totalBytes],
    ["Permission errors", result.permissionErrors],
    ["Scan duration ms", result.elapsedMs],
    [],
    ["Largest Files"],
    ["Name", "Size bytes", "Extension", "Modified ms", "Path"],
    ...result.largestFiles.map((file) => [
      file.name,
      file.sizeBytes,
      file.extension,
      file.modifiedMs,
      file.path,
    ]),
    [],
    ["Largest Folders"],
    ["Name", "Size bytes", "File count", "Path"],
    ...result.largestDirectories.map((folder) => [
      folder.name,
      folder.sizeBytes,
      folder.fileCount,
      folder.path,
    ]),
    [],
    ["File Types"],
    ["Extension", "Total bytes", "File count", "Largest file bytes"],
    ...result.fileTypes.map((stat) => [
      stat.extension,
      stat.totalBytes,
      stat.fileCount,
      stat.largestFileBytes,
    ]),
  ];
  return toCsv(rows);
}
