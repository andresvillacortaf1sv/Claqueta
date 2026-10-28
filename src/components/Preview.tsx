import { useMemo, useState } from "react";
import { paginate } from "../lib/layout";
import { Block } from "../lib/serialize";

interface Props {
  blocks: Block[];
  onClose: () => void;
}

export function Preview({ blocks, onClose }: Props) {
  const pages = useMemo(() => paginate(blocks), [blocks]);
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      // Carga diferida: jsPDF solo se descarga al exportar, no al abrir el editor.
      const { exportarPDF } = await import("../lib/pdf");
      exportarPDF(blocks, "guion");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="preview-overlay" role="dialog" aria-label="Vista previa paginada">
      <div className="preview-bar">
        <span className="preview-count">
          {pages.length} {pages.length === 1 ? "página" : "páginas"}
        </span>
        <div className="preview-actions">
          <button className="btn-primary" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exportando…" : "Exportar PDF"}
          </button>
          <button className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>

      <div className="preview-scroll">
        {pages.map((p) => (
          <div className="pv-page" key={p.number}>
            {p.number > 1 && <div className="pv-num">{p.number}.</div>}
            <div className="pv-body">
              {p.lines.map((l, i) =>
                l.kind === "blank" ? (
                  <div className="pv-line pv-blank" key={i} />
                ) : (
                  <div className={`pv-line pv-${l.style}`} key={i}>
                    {l.text}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
