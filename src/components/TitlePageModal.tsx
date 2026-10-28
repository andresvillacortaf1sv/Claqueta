import { useState } from "react";
import { TitlePage } from "../lib/titlepage";

interface Props {
  initial: TitlePage;
  onSave: (tp: TitlePage) => void;
  onClose: () => void;
}

export function TitlePageModal({ initial, onSave, onClose }: Props) {
  const [tp, setTp] = useState<TitlePage>(initial);
  const set = (k: keyof TitlePage) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setTp((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="modal-overlay" role="dialog" aria-label="Página de título">
      <div className="modal">
        <h2 className="modal-title">Página de título</h2>

        <label className="field">
          <span>Título</span>
          <input value={tp.title} onChange={set("title")} placeholder="EL TÍTULO DE TU GUION" />
        </label>

        <label className="field">
          <span>Escrito por</span>
          <input value={tp.author} onChange={set("author")} placeholder="Tu nombre" />
        </label>

        <label className="field">
          <span>Basado en (opcional)</span>
          <input value={tp.basedOn} onChange={set("basedOn")} placeholder="una historia de…" />
        </label>

        <label className="field">
          <span>Contacto</span>
          <textarea rows={3} value={tp.contact} onChange={set("contact")} placeholder="Correo, teléfono…" />
        </label>

        <label className="field">
          <span>Borrador / fecha (opcional)</span>
          <input value={tp.draft} onChange={set("draft")} placeholder="Primer borrador · octubre 2026" />
        </label>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              onSave(tp);
              onClose();
            }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
