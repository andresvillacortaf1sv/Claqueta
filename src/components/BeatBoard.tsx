import { useState } from "react";
import { Scene } from "../lib/scenes";

interface Props {
  scenes: Scene[];
  onReorder: (from: number, to: number) => void;
  onEditSummary: (pos: number, text: string) => void;
  onJump: (pos: number) => void;
  onClose: () => void;
}

export function BeatBoard({ scenes, onReorder, onEditSummary, onJump, onClose }: Props) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Escaleta">
      <div className="beatboard-bar">
        <span className="beatboard-count">
          Escaleta · {scenes.length} {scenes.length === 1 ? "escena" : "escenas"}
        </span>
        <span className="beatboard-hint">Arrastra las tarjetas para reordenar las escenas</span>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="beatboard-grid">
        {scenes.map((s, i) => (
          <div
            key={s.pos}
            className={
              "beat-card" + (over === i ? " is-over" : "") + (drag === i ? " is-drag" : "")
            }
            draggable
            onDragStart={() => setDrag(i)}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(i);
            }}
            onDragEnd={() => {
              setDrag(null);
              setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (drag !== null && drag !== i) onReorder(drag, i);
              setDrag(null);
              setOver(null);
            }}
          >
            <div className="beat-card-head">
              <span className="beat-num">{i + 1}</span>
              <button
                className="beat-goto"
                title="Ir a la escena"
                onClick={() => {
                  onJump(s.pos);
                  onClose();
                }}
              >
                {s.heading}
              </button>
            </div>
            <textarea
              className="beat-summary"
              defaultValue={s.summary}
              placeholder="Resumen / beat de la escena…"
              onBlur={(e) => onEditSummary(s.pos, e.target.value)}
            />
            {s.synopsis && <div className="beat-synopsis">{s.synopsis}</div>}
          </div>
        ))}
        {scenes.length === 0 && (
          <div className="beat-empty">
            Aún no hay escenas. Crea encabezados (INT./EXT.) en el guion y aparecerán aquí como
            tarjetas.
          </div>
        )}
      </div>
    </div>
  );
}
