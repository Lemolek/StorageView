import { open } from "@tauri-apps/plugin-dialog";

export async function selectFolder(
  defaultPath?: string | null,
): Promise<string | null> {
  const selection = await open({
    directory: true,
    multiple: false,
    title: "Select a folder to scan",
    ...(defaultPath ? { defaultPath } : {}),
  });
  return typeof selection === "string" ? selection : null;
}
