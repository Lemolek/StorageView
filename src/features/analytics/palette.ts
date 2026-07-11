import type { Theme } from "@/app/providers/ThemeProvider";

export interface ChartPalette {
  categorical: string[];
  other: string;
  bar: string;
  sequence: string[];
  grid: string;
  axisText: string;
  tooltipBackground: string;
  tooltipBorder: string;
  tooltipText: string;
  markStroke: string;
}

const darkPalette: ChartPalette = {
  categorical: [
    "#3987e5",
    "#199e70",
    "#c98500",
    "#008300",
    "#9085e9",
    "#e66767",
    "#d55181",
    "#d95926",
  ],
  other: "#5d6b7e",
  bar: "#3987e5",
  sequence: [
    "#3987e5",
    "#2a78d6",
    "#256abf",
    "#1c5cab",
    "#184f95",
    "#104281",
    "#0d366b",
  ],
  grid: "#293442",
  axisText: "#9aa5b1",
  tooltipBackground: "#1a232d",
  tooltipBorder: "#293442",
  tooltipText: "#f2f5f7",
  markStroke: "#131a22",
};

const lightPalette: ChartPalette = {
  categorical: [
    "#2a78d6",
    "#1baf7a",
    "#eda100",
    "#008300",
    "#4a3aa7",
    "#e34948",
    "#e87ba4",
    "#eb6834",
  ],
  other: "#8a94a3",
  bar: "#2a78d6",
  sequence: [
    "#2a78d6",
    "#3987e5",
    "#5598e7",
    "#6da7ec",
    "#86b6ef",
    "#9ec5f4",
    "#b7d3f6",
  ],
  grid: "#dfe5ec",
  axisText: "#5d6b7e",
  tooltipBackground: "#ffffff",
  tooltipBorder: "#dfe5ec",
  tooltipText: "#101828",
  markStroke: "#ffffff",
};

export function chartPalette(theme: Theme): ChartPalette {
  return theme === "dark" ? darkPalette : lightPalette;
}
