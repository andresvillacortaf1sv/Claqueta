import { useEffect, useRef, useState } from "react";

interface Props {
  note: { id: string; left: number; top: number; text: string };
  onSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function NoteEditor({ note, onSave, onDelete, onClose }: Props) {
  const [text, setText] = useState(note.text);
  const ref = useRef<HTMLDivElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    areaRef.current?.focus();
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onSave(note.id, text);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [text, note.id, onSave]);

  // Posición: cerca del marcador, sin salirse por la izquierda.
  const left = Math.max(12, note.left - 40);
  const top = Math.min(window.innerHeight - 180, note.top + 18);

  return (
    <div className="note-editor" ref={ref} style={{ left, top }}>
      <div className="note-editor-head">
        <span>📝 Nota</span>
        <button className="note-editor-x" onClick={onClose} title="Cerrar sin guardar">
          ×
        </button>
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
        <button className="btn-primary" onClick={() => onSave(note.id, text)}>
          Guardar
        </button>
      </div>
    </div>
  );
}
