import { useState } from "react";

interface Props {
  mode: "new" | "rename";
  initialName: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function ProjectModal({ mode, initialName, onConfirm, onClose }: Props) {
  const [name, setName] = useState(initialName);
  return (
    <div className="modal-overlay" role="dialog" aria-label="Documento">
      <div className="modal">
        <h2 className="modal-title">{mode === "new" ? "Nuevo documento" : "Renombrar documento"}</h2>
        <label className="field">
          <span>Nombre del guion</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm(name)}
            placeholder="Mi guion"
          />
        </label>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={() => onConfirm(name)}>
            {mode === "new" ? "Crear" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
