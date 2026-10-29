import { CharacterStat } from "../lib/characters";

interface Props {
  characters: CharacterStat[];
  onOpenBio: (name: string) => void;
  onOpenMap: () => void;
  onJump: (pos: number) => void;
  onClose: () => void;
}

export function CharacterBoard({ characters, onOpenBio, onOpenMap, onJump, onClose }: Props) {
  const maxDialogues = Math.max(1, ...characters.map((c) => c.dialogues));

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Personajes">
      <div className="beatboard-bar">
        <span className="beatboard-count">Personajes · {characters.length}</span>
        <span className="beatboard-hint">Reparto detectado automáticamente del guion</span>
        <button className="btn-ghost" onClick={onOpenMap}>
          Mapa relacional
        </button>
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
              <span><strong>{c.dialogues}</strong> parlamentos</span>
              <span><strong>{c.scenes}</strong> escenas</span>
              <span><strong>{c.words}</strong> palabras</span>
            </div>

            <div className="char-bar">
              <div className="char-bar-fill" style={{ width: `${(c.dialogues / maxDialogues) * 100}%` }} />
            </div>

            <button className="rb-btn char-bio-btn" onClick={() => onOpenBio(c.name)}>
              Abrir biografía
            </button>
          </div>
        ))}
        {characters.length === 0 && (
          <div className="beat-empty">
            Aún no hay personajes. Añade elementos de tipo PERSONAJE con su diálogo y aparecerán aquí.
          </div>
        )}
      </div>
    </div>
  );
}
