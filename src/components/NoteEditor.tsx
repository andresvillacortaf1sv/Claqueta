import { useEffect, useRef, useState } from "react";
import { NOTE_CATEGORIES } from "../editor/notes";

interface Props {
  note: { id: string; left: number; top: number; text: string; category?: string };
  onSave: (id: string, text: string, category: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(note.text);
  const [category, setCategory] = useState(note.category ?? "director");
  const ref = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onSave(note.id, text, category);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [text, category, note.id, onSave]);

  const left = Math.max(12, Math.min(window.innerWidth - 300, note.left - 40));
  const top = Math.min(window.innerHeight - 260, note.top + 18);

  return (
    <div className="note-editor" ref={ref} style={{ left, top }}>
      <div className="note-editor-head">
        <span>✎ Nota</span>
        <button className="note-editor-x" onClick={onClose} title="Cerrar sin guardar">
          ×
        </button>
      </div>

      <div className="note-cat-row">
        {NOTE_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={"note-cat" + (category === c.id ? " is-on" : "")}
            style={{ borderColor: c.color, color: category === c.id ? "#1a1407" : c.color, background: category === c.id ? c.color : "transparent" }}
            onClick={() => setCategory(c.id)}
            title={c.label}
          >
            {c.label}
          </button>
        ))}
      </div>

      <textarea
        ref={areaRef}
        className="note-editor-text"
        value={text}
        placeholder="Escribe tu nota…"
        onChange={(e) => setText(e.target.value)}
      />
      <div className="note-editor-actions">
        <button className="note-editor-del" onClick={() => onDelete(note.id)}>
          Eliminar
        </button>
        <button className="btn-primary" onClick={() => onSave(note.id, text, category)}>
          Guardar
        </button>
      </div>
    </div>
  );
}
