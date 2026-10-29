import { useEffect, useState } from "react";
import { Development, loadDevelopment, saveDevelopment } from "../lib/development";

interface Props {
  onClose: () => void;
}

export function DevelopmentModal({ onClose }: Props) {
  const [dev, setDev] = useState<Development>(() => loadDevelopment());

  useEffect(() => {
    const t = setTimeout(() => saveDevelopment(dev), 400);
    return () => clearTimeout(t);
  }, [dev]);

  const set = (k: keyof Development) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDev((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Desarrollo del proyecto">
      <div className="beatboard-bar">
        <span className="beatboard-count">Desarrollo del proyecto</span>
        <span className="beatboard-hint">Logline, tagline, sinopsis y tratamiento · se guarda solo</span>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="dev-body">
        <label className="dev-field">
          <span>Logline</span>
          <small>Una frase: protagonista + conflicto + meta.</small>
          <textarea rows={2} value={dev.logline} onChange={set("logline")} placeholder="Un/a ___ debe ___ antes de ___." />
        </label>

        <label className="dev-field">
          <span>Tagline</span>
          <small>El eslogan del póster, memorable y corto.</small>
          <input value={dev.tagline} onChange={set("tagline")} placeholder="La frase gancho…" />
        </label>

        <label className="dev-field">
          <span>Sinopsis</span>
          <small>Uno o dos párrafos con el arco principal.</small>
          <textarea rows={6} value={dev.sinopsis} onChange={set("sinopsis")} />
        </label>

        <label className="dev-field">
          <span>Tratamiento</span>
          <small>El relato en prosa, escena a escena, en presente.</small>
          <textarea rows={16} value={dev.tratamiento} onChange={set("tratamiento")} />
        </label>
      </div>
    </div>
  );
}
