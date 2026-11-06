/**
 * Capa de notas en el margen: muestra las notas del director en el área oscura
 * junto a la página, alineadas con la línea que anotan. Siempre visibles; al
 * pasar el cursor se expanden para leerlas completas; clic para editar.
 */
export interface MarginNote {
  id: string;
  text: string;
  top: number;
  left: number;
  side: "left" | "right";
  color: string;
  categoryLabel: string;
}

interface Props {
  notes: MarginNote[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotesMargin({ notes, onOpen, onDelete }: Props) {
  return (
    <>
      {notes.map((n) => (
        <div
          key={n.id}
          className={"margin-note margin-note-" + n.side}
          style={{ top: n.top, left: n.left, borderColor: n.color, ["--note-color" as string]: n.color }}
          onMouseDown={(e) => {
            e.preventDefault();
            onOpen(n.id);
          }}
          title="Clic para editar"
        >
          <div className="margin-note-bar" style={{ background: n.color }} />
          <div className="margin-note-body">
            <div className="margin-note-cat" style={{ color: n.color }}>
              {n.categoryLabel}
            </div>
            <div className="margin-note-text">{n.text.trim() || "(nota vacía)"}</div>
          </div>
          <button
            className="margin-note-del"
            title="Borrar nota"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(n.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </>
  );
}
