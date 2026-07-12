import { useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { saveReportAs } from "@/lib/api/reports";
import { isDesktopRuntime } from "@/lib/api/app";
import { contrastRatio } from "@/lib/theme/color";
import { parseThemeExport, serializeTheme } from "@/lib/theme/validateTheme";
import { cn } from "@/lib/utils/cn";
import type { Theme, ThemeColors, ThemeTokens } from "@/types/theme";

const colorFields: { key: keyof ThemeColors; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "card", label: "Card" },
  { key: "elevated", label: "Elevated" },
  { key: "border", label: "Border" },
  { key: "textPrimary", label: "Primary text" },
  { key: "textSecondary", label: "Secondary text" },
  { key: "accent", label: "Accent" },
  { key: "accentSecondary", label: "Secondary accent" },
  { key: "success", label: "Success" },
  { key: "warning", label: "Warning" },
  { key: "danger", label: "Danger" },
];

const numericFields: {
  key: "radiusPx" | "shadowIntensity" | "transparency" | "blurPx" | "animationSpeedMs";
  label: string;
  min: number;
  max: number;
  step: number;
}[] = [
  { key: "radiusPx", label: "Radius (px)", min: 4, max: 24, step: 1 },
  { key: "shadowIntensity", label: "Shadow intensity", min: 0, max: 1, step: 0.05 },
  { key: "transparency", label: "Transparency", min: 0, max: 1, step: 0.01 },
  { key: "blurPx", label: "Blur (px)", min: 0, max: 24, step: 1 },
  { key: "animationSpeedMs", label: "Animation (ms)", min: 80, max: 400, step: 10 },
];

export function ThemeSection() {
  const {
    themes,
    activeTheme,
    setActiveTheme,
    saveCustomTheme,
    deleteCustomTheme,
    duplicateTheme,
    previewTokens,
  } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ThemeTokens | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);
  const [importError, setImportError] = useState<string[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editing = themes.find((theme) => theme.id === editingId) ?? null;

  const startEditing = (id: string) => {
    const target = themes.find((theme) => theme.id === id);
    if (!target || target.builtIn) {
      return;
    }
    setEditingId(id);
    setDraft({
      ...target.tokens,
      colors: { ...target.tokens.colors },
      chartPalette: [...target.tokens.chartPalette],
      treemapPalette: [...target.tokens.treemapPalette],
    });
  };

  const updateDraft = (next: ThemeTokens) => {
    setDraft(next);
    previewTokens(next);
  };

  const stopEditing = () => {
    previewTokens(null);
    setEditingId(null);
    setDraft(null);
  };

  const saveDraft = () => {
    if (!editing || !draft) {
      return;
    }
    saveCustomTheme({ ...editing, tokens: draft });
    stopEditing();
    setMessage("Theme saved.");
  };

  const duplicate = (id: string) => {
    const source = themes.find((theme) => theme.id === id);
    if (!source) {
      return;
    }
    const copy = duplicateTheme(id, `${source.tokens.name} copy`);
    if (copy) {
      startEditingCopy(copy.id, copy.tokens);
    }
  };

  const startEditingCopy = (id: string, tokens: ThemeTokens) => {
    setEditingId(id);
    setDraft({
      ...tokens,
      colors: { ...tokens.colors },
      chartPalette: [...tokens.chartPalette],
      treemapPalette: [...tokens.treemapPalette],
    });
  };

  const exportTheme = async (id: string) => {
    const target = themes.find((theme) => theme.id === id);
    if (!target) {
      return;
    }
    try {
      const saved = await saveReportAs(
        `${target.tokens.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.storageview-theme.json`,
        serializeTheme(target.tokens),
        "json",
      );
      setMessage(saved ? "Theme exported." : null);
    } catch (cause) {
      setMessage(
        cause && typeof cause === "object" && "message" in cause
          ? String((cause as { message: unknown }).message)
          : String(cause),
      );
    }
  };

  const importThemeFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseThemeExport(String(reader.result ?? ""));
      if (!result.ok) {
        setImportError(result.errors);
        return;
      }
      const nameTaken = themes.some(
        (theme) =>
          !theme.builtIn &&
          theme.tokens.name.toLowerCase() === result.tokens.name.toLowerCase(),
      );
      const name = nameTaken ? `${result.tokens.name} (imported)` : result.tokens.name;
      saveCustomTheme({
        id: `custom.${crypto.randomUUID()}`,
        builtIn: false,
        tokens: { ...result.tokens, name },
      });
      setImportError(null);
      setMessage(`Theme "${name}" imported.`);
    };
    reader.readAsText(file);
  };

  const contrast = draft
    ? contrastRatio(draft.colors.textPrimary, draft.colors.background)
    : null;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-medium">Themes</h2>
          <p className="mt-1 text-sm text-muted">
            Built-in themes are immutable. Duplicate one to create your own.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Import theme…
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              importThemeFile(file);
            }
            event.target.value = "";
          }}
        />
      </div>
      {message ? <p className="mt-2 text-[11px] text-muted">{message}</p> : null}
      {importError ? (
        <div className="mt-2 rounded-card border border-danger/40 p-3 text-[13px]">
          <p className="font-medium text-foreground">Theme import rejected</p>
          <ul className="mt-1 list-inside list-disc text-muted">
            {importError.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ul className="mt-4 space-y-1.5">
        {themes.map((theme) => (
          <li
            key={theme.id}
            className={cn(
              "flex flex-wrap items-center gap-2 rounded-card border px-3 py-2 transition-all duration-(--motion-ms)",
              theme.id === activeTheme.id
                ? "border-primary/60 bg-primary/10 glow-accent-soft"
                : "border-border hover:bg-card-hover",
            )}
          >
            <span
              className="flex shrink-0 gap-0.5 rounded-[4px] border border-border p-0.5"
              aria-hidden="true"
            >
              {[
                theme.tokens.colors.background,
                theme.tokens.colors.card,
                theme.tokens.colors.accent,
              ].map((swatch, index) => (
                <span
                  key={index}
                  className="h-3 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: swatch }}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={() => setActiveTheme(theme.id)}
              className="min-w-0 flex-1 truncate text-left text-[13px] font-medium text-foreground"
            >
              {theme.tokens.name}
            </button>
            {theme.builtIn ? (
              <span className="rounded-[4px] border border-border px-1.5 text-[10px] uppercase tracking-wider text-muted">
                Built-in
              </span>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => duplicate(theme.id)}>
              Duplicate
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void exportTheme(theme.id)}>
              Export
            </Button>
            {!theme.builtIn ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => startEditing(theme.id)}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(theme)}>
                  Delete
                </Button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
      {editing && draft ? (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Input
              value={draft.name}
              onChange={(event) => updateDraft({ ...draft, name: event.target.value })}
              maxLength={40}
              aria-label="Theme name"
              className="w-64 font-medium"
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={stopEditing}>
                Reset unsaved
              </Button>
              <Button size="sm" onClick={saveDraft} disabled={draft.name.trim().length === 0}>
                Save theme
              </Button>
            </div>
          </div>
          {contrast !== null && contrast < 4.5 ? (
            <p className="flex items-center gap-2 rounded-card border border-warning/40 px-3 py-2 text-[13px] text-warning">
              <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              Text/background contrast is {contrast.toFixed(1)}:1 — below the
              recommended 4.5:1.
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {colorFields.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm">
                <input
                  type="color"
                  value={draft.colors[field.key]}
                  onChange={(event) =>
                    updateDraft({
                      ...draft,
                      colors: { ...draft.colors, [field.key]: event.target.value },
                    })
                  }
                  aria-label={field.label}
                  className="h-8 w-10 shrink-0 cursor-pointer rounded border border-border bg-surface"
                />
                <span className="min-w-0 flex-1 truncate text-muted">{field.label}</span>
                <span className="text-xs tabular-nums text-muted">
                  {draft.colors[field.key].toUpperCase()}
                </span>
              </label>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {numericFields.map((field) => (
              <label key={field.key} className="text-sm">
                <span className="flex justify-between text-muted">
                  {field.label}
                  <span className="tabular-nums">{draft[field.key]}</span>
                </span>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={draft[field.key]}
                  onChange={(event) =>
                    updateDraft({ ...draft, [field.key]: Number(event.target.value) })
                  }
                  className="mt-1 w-full accent-primary"
                />
              </label>
            ))}
          </div>
        </div>
      ) : null}
      <Dialog
        open={deleteTarget !== null}
        title="Delete custom theme"
        onClose={() => setDeleteTarget(null)}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (deleteTarget) {
                  deleteCustomTheme(deleteTarget.id);
                  if (editingId === deleteTarget.id) {
                    stopEditing();
                  }
                }
                setDeleteTarget(null);
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        The theme "{deleteTarget?.tokens.name}" will be removed permanently.
      </Dialog>
      {!isDesktopRuntime() ? (
        <p className="mt-3 text-xs text-muted">
          Theme export requires the desktop application.
        </p>
      ) : null}
    </Card>
  );
}
