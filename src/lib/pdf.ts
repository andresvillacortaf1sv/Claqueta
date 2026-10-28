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
import { TitlePage, hasTitlePage } from "./titlepage";
import { revisionById } from "./revisions";

const PAGE_W = 612; // 8.5"
const LEFT_MARGIN = 108; // 1.5"
const TOP_MARGIN = 72; // 1"
const CHAR_W = 7.2;
const LINE_H = 12;
const RIGHT_EDGE = LEFT_MARGIN + 60 * CHAR_W; // 540 (= 7.5" desde la izq.)

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [0, 0, 0];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Aclara un color hacia el blanco para usarlo como sombreado de revisión. */
function lighten(hex: string, t = 0.8): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c * (1 - t) + 255 * t);
  return [mix(r), mix(g), mix(b)];
}

function drawTitlePage(doc: jsPDF, tp: TitlePage): void {
  doc.setFont("courier", "normal");
  doc.setFontSize(12);
  const cx = PAGE_W / 2;

  if (tp.title) {
    doc.setFont("courier", "bold");
    doc.text(tp.title.toUpperCase(), cx, 288, { align: "center" }); // ~4"
    doc.setFont("courier", "normal");
  }
  if (tp.author) {
    doc.text("escrito por", cx, 336, { align: "center" });
    doc.text(tp.author, cx, 360, { align: "center" });
  }
  if (tp.basedOn) {
    doc.text(tp.basedOn, cx, 408, { align: "center" });
  }
  if (tp.contact) {
    const lines = tp.contact.split(/\n/);
    lines.forEach((ln, i) => doc.text(ln, LEFT_MARGIN, 648 + i * LINE_H));
  }
  if (tp.draft) {
    doc.text(tp.draft, RIGHT_EDGE, 648, { align: "right" });
  }
}

export function exportarPDF(blocks: Block[], titlePage?: TitlePage, titulo = "guion"): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pages = paginate(blocks, LINES_PER_PAGE);
  doc.setFontSize(12);

  let first = true;
  if (titlePage && hasTitlePage(titlePage)) {
    drawTitlePage(doc, titlePage);
    first = false;
  }

  pages.forEach((page) => {
    if (!first) doc.addPage();
    first = false;

    if (page.number > 1) {
      doc.setFont("courier", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`${page.number}.`, RIGHT_EDGE, 50, { align: "right" });
    }

    page.lines.forEach((line, n) => {
      if (line.kind === "blank") return;
      const m = METRICS[line.style];
      const y = TOP_MARGIN + LINE_H * (n + 1);

      // Sombreado de revisión (rectángulo claro detrás de la línea).
      if (line.revision) {
        const rev = revisionById(line.revision);
        const [lr, lg, lb] = lighten(rev?.hex ?? "#b1223b");
        const w = Math.max(line.text.length, 1) * CHAR_W;
        const x = m.align === "right" ? RIGHT_EDGE - w : LEFT_MARGIN + m.indent * CHAR_W;
        doc.setFillColor(lr, lg, lb);
        doc.rect(x - 1.5, y - 9.5, w + 3, LINE_H, "F");
      }

      doc.setFont("courier", m.bold ? "bold" : "normal");
      doc.setTextColor(0, 0, 0);
      if (m.align === "right") doc.text(line.text, RIGHT_EDGE, y, { align: "right" });
      else doc.text(line.text, LEFT_MARGIN + m.indent * CHAR_W, y);
    });
  });

  doc.save(`${titulo}.pdf`);
}
