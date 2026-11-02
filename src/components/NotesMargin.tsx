/**
 * Capa de notas en el margen: muestra las notas del director en el área oscura
 * junto a la página, alineadas verticalmente con la línea que anotan. Siempre
 * visibles; al hacer clic se editan.
 */
export interface MarginNote {
  id: string;
  text: string;
  top: number; // px, relativo a la ventana (fixed)
  left: number;
  side: "left" | "right";
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
          style={{ top: n.top, left: n.left }}
          onMouseDown={(e) => {
            e.preventDefault();
            onOpen(n.id);
          }}
          title="Clic para editar · papelera para borrar"
        >
          <span className="margin-note-pin">✎</span>
          <span className="margin-note-text">{n.text.trim() || "(nota vacía)"}</span>
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
