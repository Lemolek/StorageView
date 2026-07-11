import { invoke } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";

export async function saveReportAs(
  defaultName: string,
  contents: string,
  format: "json" | "csv",
): Promise<boolean> {
  const path = await save({
    defaultPath: defaultName,
    filters: [{ name: format.toUpperCase(), extensions: [format] }],
    title: "Save report",
  });
  if (!path) {
    return false;
  }
  await invoke<void>("save_report", { path, contents });
  return true;
}
