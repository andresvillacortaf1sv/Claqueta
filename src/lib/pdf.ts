/**
 * Exportación a PDF fiel al formato de industria, 100% en el navegador
 * (local-first, sin servidor). Reusa el mismo paginador que la vista previa, así
 * que el PDF y la pantalla coinciden página por página.
 *
 * Unidades en puntos (1 pulgada = 72 pt). Página US Letter = 612 × 792 pt.
 * Courier 12pt → 7.2 pt por carácter (10 cpi) y 12 pt por línea (6 lpi).
 */
import { jsPDF } from "jspdf";
import { paginate, METRICS, LINES_PER_PAGE } from "./layout";
import { Block } from "./serialize";

const LEFT_MARGIN = 108; // 1.5"
const TOP_MARGIN = 72; // 1"
const CHAR_W = 7.2;
const LINE_H = 12;
const RIGHT_EDGE = LEFT_MARGIN + 60 * CHAR_W; // 108 + 432 = 540 (= 7.5" desde la izq.)

export function exportarPDF(blocks: Block[], titulo = "guion"): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pages = paginate(blocks, LINES_PER_PAGE);

  doc.setFontSize(12);

  pages.forEach((page, pi) => {
    if (pi > 0) doc.addPage();

    // Número de página arriba a la derecha (desde la página 2).
    if (page.number > 1) {
      doc.setFont("courier", "normal");
      doc.text(`${page.number}.`, RIGHT_EDGE, 50, { align: "right" });
    }

    page.lines.forEach((line, n) => {
      if (line.kind === "blank") return;
      const m = METRICS[line.style];
      doc.setFont("courier", m.bold ? "bold" : "normal");
      const y = TOP_MARGIN + LINE_H * (n + 1);
      if (m.align === "right") {
        doc.text(line.text, RIGHT_EDGE, y, { align: "right" });
      } else {
        doc.text(line.text, LEFT_MARGIN + m.indent * CHAR_W, y);
      }
    });
  });

  doc.save(`${titulo}.pdf`);
}
