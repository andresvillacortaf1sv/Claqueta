import { ElementType, ENTER_NEXT, ELEMENT_LABELS } from "../editor/elements";

interface Props {
  current: ElementType;
  label: string;
  hint: string;
  empty: boolean;
  save: "guardado" | "guardando";
}

export function StatusBar({ current, label, hint, empty, save }: Props) {
  const next = ELEMENT_LABELS[ENTER_NEXT[current]];
  return (
    <div className="statusbar">
      <div className="status-left">
        <span className="status-chip">{label}</span>
        <span className="status-hint">{hint}</span>
      </div>
      <div className="status-right">
        <span className="status-keys">
          {empty ? (
            <>
              <kbd>Enter</kbd> cambia de elemento · <kbd>Tab</kbd> también
            </>
          ) : (
            <>
              <kbd>Tab</kbd> cambia · <kbd>Enter</kbd> → {next}
            </>
          )}
        </span>
        <span className={"status-save " + save}>
          {save === "guardado" ? "● Guardado" : "○ Guardando…"}
        </span>
      </div>
    </div>
  );
}
