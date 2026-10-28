import { CharacterStat } from "../lib/characters";
import { CharacterNotes } from "../lib/characterNotes";

interface Props {
  characters: CharacterStat[];
  notes: CharacterNotes;
  onEditNote: (name: string, text: string) => void;
  onJump: (pos: number) => void;
  onClose: () => void;
}

export function CharacterBoard({ characters, notes, onEditNote, onJump, onClose }: Props) {
  const maxDialogues = Math.max(1, ...characters.map((c) => c.dialogues));

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Personajes">
      <div className="beatboard-bar">
        <span className="beatboard-count">
          Personajes · {characters.length}
        </span>
        <span className="beatboard-hint">Reparto detectado automáticamente del guion</span>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="beatboard-grid">
        {characters.map((c) => (
          <div className="char-card" key={c.name}>
            <div className="char-card-head">
              <button
                className="char-name"
                title="Ir a su primera intervención"
                onClick={() => {
                  onJump(c.firstPos);
                  onClose();
                }}
              >
                {c.name}
              </button>
            </div>

            <div className="char-stats">
              <span>
                <strong>{c.dialogues}</strong> parlamentos
              </span>
              <span>
                <strong>{c.scenes}</strong> escenas
              </span>
              <span>
                <strong>{c.words}</strong> palabras
              </span>
            </div>

            <div className="char-bar">
              <div
                className="char-bar-fill"
                style={{ width: `${(c.dialogues / maxDialogues) * 100}%` }}
              />
            </div>

            <textarea
              className="char-note"
              defaultValue={notes[c.name] ?? ""}
              placeholder="Ficha: descripción, arco, objetivo…"
              onBlur={(e) => onEditNote(c.name, e.target.value)}
            />
          </div>
        ))}
        {characters.length === 0 && (
          <div className="beat-empty">
            Aún no hay personajes. Añade elementos de tipo PERSONAJE con su diálogo y aparecerán
            aquí con sus reportes.
          </div>
        )}
      </div>
    </div>
  );
}
