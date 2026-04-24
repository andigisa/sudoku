import Modal from "./Modal";
import { themes } from "../themes";

interface Props {
  open: boolean;
  onClose: () => void;
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

const SWATCH_KEYS = ["primary", "surface", "secondary", "on-surface", "tertiary-fixed"] as const;

export default function ThemePickerModal({ open, onClose, currentTheme, onSelectTheme }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Themes">
      <div className="theme-grid">
        {themes.map((theme) => {
          const active = theme.id === currentTheme;
          return (
            <button
              key={theme.id}
              className={`theme-card ${active ? "theme-card--active" : ""}`}
              onClick={() => onSelectTheme(theme.id)}
              type="button"
            >
              <div className="theme-card-swatches">
                {SWATCH_KEYS.map((key) => (
                  <span
                    key={key}
                    className="theme-swatch"
                    style={{ background: theme.variables[key] }}
                  />
                ))}
              </div>
              <div className="theme-card-label">
                <span className="material-symbols-outlined" style={{ fontSize: "1rem" }}>
                  {theme.icon}
                </span>
                <span>{theme.name}</span>
              </div>
              {active && (
                <span className="material-symbols-outlined theme-card-check" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
