import { useMemo, useState } from "react";
import { paginate } from "../lib/layout";
import { Block } from "../lib/serialize";
import { TitlePage, hasTitlePage } from "../lib/titlepage";
import { revisionById } from "../lib/revisions";

interface Props {
  blocks: Block[];
  titlePage: TitlePage;
  onClose: () => void;
}

export function Preview({ blocks, titlePage, onClose }: Props) {
  const pages = useMemo(() => paginate(blocks), [blocks]);
  const [exporting, setExporting] = useState(false);
  const showTitle = hasTitlePage(titlePage);

  async function handleExport() {
    setExporting(true);
    try {
      const { exportarPDF } = await import("../lib/pdf");
      exportarPDF(blocks, titlePage, "guion");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="preview-overlay" role="dialog" aria-label="Vista previa paginada">
      <div className="preview-bar">
        <span className="preview-count">
          {pages.length} {pages.length === 1 ? "página" : "páginas"}
          {showTitle ? " + portada" : ""}
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
        {showTitle && (
          <div className="pv-page pv-titlepage">
            <div className="pv-title-main">
              {titlePage.title && <div className="pv-title">{titlePage.title}</div>}
              {titlePage.author && (
                <div className="pv-byline">
                  escrito por
                  <br />
                  {titlePage.author}
                </div>
              )}
              {titlePage.basedOn && <div className="pv-basedon">{titlePage.basedOn}</div>}
            </div>
            <div className="pv-title-foot">
              <div className="pv-contact">{titlePage.contact}</div>
              <div className="pv-draft">{titlePage.draft}</div>
            </div>
          </div>
        )}

        {pages.map((p) => (
          <div className="pv-page" key={p.number}>
            {p.number > 1 && <div className="pv-num">{p.number}.</div>}
            <div className="pv-body">
              {p.lines.map((l, i) =>
                l.kind === "blank" ? (
                  <div className="pv-line pv-blank" key={i} />
                ) : (
                  <div
                    className={`pv-line pv-${l.style}`}
                    key={i}
                    data-rev={l.revision ?? undefined}
                    style={
                      l.revision
                        ? ({ ["--rev-color" as string]: revisionById(l.revision)?.hex } as React.CSSProperties)
                        : undefined
                    }
                  >
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
