import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyTheme } from "@/lib/theme/applyTheme";
import { isDarkColor } from "@/lib/theme/color";
import { builtInThemes, LIGHT_ID, NOIR_ID } from "@/lib/theme/themes";
import type { Theme as ThemeDefinition, ThemeTokens } from "@/types/theme";

export type Theme = "dark" | "light";

const ACTIVE_KEY = "storageview.theme-engine.active";
const CUSTOM_KEY = "storageview.theme-engine.custom";
const LEGACY_KEY = "storageview.theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  themes: ThemeDefinition[];
  activeTheme: ThemeDefinition;
  setActiveTheme: (id: string) => void;
  saveCustomTheme: (theme: ThemeDefinition) => void;
  deleteCustomTheme: (id: string) => void;
  duplicateTheme: (id: string, newName: string) => ThemeDefinition | null;
  previewTokens: (tokens: ThemeTokens | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readCustomThemes(): ThemeDefinition[] {
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (entry): entry is ThemeDefinition =>
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as ThemeDefinition).id === "string" &&
        !(entry as ThemeDefinition).builtIn &&
        typeof (entry as ThemeDefinition).tokens === "object",
    );
  } catch {
    return [];
  }
}

function readActiveThemeId(): string {
  const stored = window.localStorage.getItem(ACTIVE_KEY);
  if (stored) {
    return stored;
  }
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  return legacy === "light" ? LIGHT_ID : NOIR_ID;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [customThemes, setCustomThemes] = useState<ThemeDefinition[]>(readCustomThemes);
  const [activeThemeId, setActiveThemeId] = useState<string>(readActiveThemeId);
  const [preview, setPreview] = useState<ThemeTokens | null>(null);

  const themes = useMemo(
    () => [...builtInThemes, ...customThemes],
    [customThemes],
  );

  const activeTheme = useMemo(
    () => themes.find((theme) => theme.id === activeThemeId) ?? builtInThemes[0]!,
    [themes, activeThemeId],
  );

  useEffect(() => {
    applyTheme(preview ?? activeTheme.tokens);
  }, [preview, activeTheme]);

  useEffect(() => {
    window.localStorage.setItem(ACTIVE_KEY, activeTheme.id);
  }, [activeTheme]);

  useEffect(() => {
    window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(customThemes));
  }, [customThemes]);

  const value = useMemo<ThemeContextValue>(() => {
    const mode: Theme = isDarkColor(activeTheme.tokens.colors.background)
      ? "dark"
      : "light";
    return {
      theme: mode,
      setTheme: (target) => setActiveThemeId(target === "dark" ? NOIR_ID : LIGHT_ID),
      toggleTheme: () =>
        setActiveThemeId(mode === "dark" ? LIGHT_ID : NOIR_ID),
      themes,
      activeTheme,
      setActiveTheme: (id) => {
        setPreview(null);
        setActiveThemeId(id);
      },
      saveCustomTheme: (theme) => {
        setPreview(null);
        setCustomThemes((current) => {
          const existing = current.findIndex((entry) => entry.id === theme.id);
          if (existing >= 0) {
            const next = [...current];
            next[existing] = theme;
            return next;
          }
          return [...current, theme];
        });
      },
      deleteCustomTheme: (id) => {
        setCustomThemes((current) => current.filter((entry) => entry.id !== id));
        setActiveThemeId((current) => (current === id ? NOIR_ID : current));
      },
      duplicateTheme: (id, newName) => {
        const source = themes.find((entry) => entry.id === id);
        if (!source) {
          return null;
        }
        const copy: ThemeDefinition = {
          id: `custom.${crypto.randomUUID()}`,
          builtIn: false,
          tokens: {
            ...source.tokens,
            name: newName,
            colors: { ...source.tokens.colors },
            chartPalette: [...source.tokens.chartPalette],
            treemapPalette: [...source.tokens.treemapPalette],
          },
        };
        setCustomThemes((current) => [...current, copy]);
        return copy;
      },
      previewTokens: setPreview,
    };
  }, [themes, activeTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
