export interface Theme {
  id: string;
  name: string;
  icon: string;
  variables: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: "default",
    name: "Light",
    icon: "light_mode",
    variables: {
      "primary": "#182442",
      "primary-container": "#2e3a59",
      "on-primary": "#ffffff",
      "on-primary-container": "#98a4c9",
      "secondary": "#0060ac",
      "secondary-fixed": "#d4e3ff",
      "secondary-fixed-dim": "#a4c9ff",
      "error": "#ba1a1a",
      "error-container": "#ffdad6",
      "surface": "#f9f9fb",
      "surface-container-lowest": "#ffffff",
      "surface-container-low": "#f3f3f5",
      "surface-container": "#eeeef0",
      "surface-container-high": "#e8e8ea",
      "surface-container-highest": "#e2e2e4",
      "on-surface": "#1a1c1d",
      "on-surface-variant": "#45464e",
      "outline": "#75777e",
      "outline-variant": "#c6c6ce",
      "tertiary-fixed": "#b1f0ce",
      "board-bg": "rgba(24, 36, 66, 0.9)",
      "box-gap": "rgba(140, 143, 158, 0.4)",
      "cell-related-bg": "#d5d6da",
      "completed-bg": "#002114",
      "completed-color": "#b1f0ce"
    }
  },
  {
    id: "dark",
    name: "Dark",
    icon: "dark_mode",
    variables: {
      "primary": "#a4c9ff",
      "primary-container": "#1a3a6b",
      "on-primary": "#0a1929",
      "on-primary-container": "#d4e3ff",
      "secondary": "#82b1ff",
      "secondary-fixed": "#1a3a6b",
      "secondary-fixed-dim": "#3a5a8b",
      "error": "#ffb4ab",
      "error-container": "#93000a",
      "surface": "#121316",
      "surface-container-lowest": "#0d0e10",
      "surface-container-low": "#1a1b1e",
      "surface-container": "#1f2023",
      "surface-container-high": "#292a2d",
      "surface-container-highest": "#343538",
      "on-surface": "#e3e2e6",
      "on-surface-variant": "#c4c6d0",
      "outline": "#8e9099",
      "outline-variant": "#44474f",
      "tertiary-fixed": "#1a4a2e",
      "board-bg": "rgba(112, 136, 176, 0.5)",
      "board-gap": "4px",
      "box-gap": "rgba(140, 143, 158, 0.08)",
      "cell-related-bg": "#2a2b2f",
      "completed-bg": "#1a4a2e",
      "completed-color": "#b1f0ce"
    }
  },
  {
    id: "ocean",
    name: "Ocean",
    icon: "water",
    variables: {
      "primary": "#006c7a",
      "primary-container": "#0e4d58",
      "on-primary": "#ffffff",
      "on-primary-container": "#a2d8e2",
      "secondary": "#0077b6",
      "secondary-fixed": "#cce5ff",
      "secondary-fixed-dim": "#90caf9",
      "error": "#ba1a1a",
      "error-container": "#ffdad6",
      "surface": "#f0f7fa",
      "surface-container-lowest": "#ffffff",
      "surface-container-low": "#e8f2f6",
      "surface-container": "#e0ecf1",
      "surface-container-high": "#d8e6ec",
      "surface-container-highest": "#d0e0e7",
      "on-surface": "#161d20",
      "on-surface-variant": "#3d4a4f",
      "outline": "#6b7a80",
      "outline-variant": "#bccdd4",
      "tertiary-fixed": "#b1f0ce",
      "board-bg": "rgba(14, 77, 88, 0.85)",
      "box-gap": "rgba(100, 160, 180, 0.35)",
      "cell-related-bg": "#d0e6ed",
      "completed-bg": "#002114",
      "completed-color": "#b1f0ce"
    }
  },
  {
    id: "sepia",
    name: "Sepia",
    icon: "local_cafe",
    variables: {
      "primary": "#5d4037",
      "primary-container": "#4e342e",
      "on-primary": "#ffffff",
      "on-primary-container": "#d7ccc8",
      "secondary": "#8d6e63",
      "secondary-fixed": "#efebe9",
      "secondary-fixed-dim": "#d7ccc8",
      "error": "#c62828",
      "error-container": "#ffdad6",
      "surface": "#faf6f0",
      "surface-container-lowest": "#ffffff",
      "surface-container-low": "#f5efe7",
      "surface-container": "#efe8de",
      "surface-container-high": "#e9e1d5",
      "surface-container-highest": "#e3dacc",
      "on-surface": "#1c1a17",
      "on-surface-variant": "#4a4640",
      "outline": "#7d7770",
      "outline-variant": "#cdc6bc",
      "tertiary-fixed": "#c8e6c9",
      "board-bg": "rgba(93, 64, 55, 0.85)",
      "box-gap": "rgba(160, 140, 120, 0.35)",
      "cell-related-bg": "#e3d9cc",
      "completed-bg": "#1b3a1b",
      "completed-color": "#c8e6c9"
    }
  }
];

export function applyThemeVars(themeId: string): void {
  const theme = themes.find((t) => t.id === themeId) ?? themes[0];
  for (const [prop, value] of Object.entries(theme.variables)) {
    document.documentElement.style.setProperty(`--${prop}`, value);
  }
}
