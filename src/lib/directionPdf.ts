/**
 * Exportes a PDF del módulo de Dirección: desglose técnico, lista de planos y
 * plan de rodaje. Generados en el navegador con jsPDF (carga diferida).
 */
import { jsPDF } from "jspdf";
import { SceneBreakdown } from "./breakdown";
import { DirectionData, getScene, allDepartments } from "./direction";
import { Schedule } from "./schedule";

const M = 54; // margen 0.75"
const PW = 612;
const PH = 792;

interface Ctx {
  doc: jsPDF;
  y: number;
}

function header(doc: jsPDF, title: string, subtitle = ""): number {
  doc.setFillColor(27, 26, 24);
  doc.rect(0, 0, PW, 60, "F");
  doc.setTextColor(200, 128, 58);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(title, M, 34);
  if (subtitle) {
    doc.setTextColor(150, 145, 136);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(subtitle, M, 48);
  }
  doc.setTextColor(20, 20, 20);
  return 84;
}

function ensure(c: Ctx, needed: number, title: string, subtitle = "") {
  if (c.y + needed > PH - M) {
    c.doc.addPage();
    c.y = header(c.doc, title, subtitle);
  }
}

function wrap(doc: jsPDF, text: string, width: number, size: number): string[] {
  doc.setFontSize(size);
  return doc.splitTextToSize(text || "", width);
}

/* ---------- Desglose técnico ---------- */
export function exportBreakdownPDF(scenes: SceneBreakdown[], data: DirectionData, title = "Desglose técnico"): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const depts = allDepartments();
  const c: Ctx = { doc, y: header(doc, title, `${scenes.length} escenas · generado por Claqueta`) };

  scenes.forEach((s) => {
    const ds = getScene(data, s.heading.toUpperCase().trim());
    const used = depts.filter((d) => (ds.notes[d.id] ?? "").trim() || (ds.status[d.id] && ds.status[d.id] !== "Sin empezar"));
    ensure(c, 60, title);

    // Cabecera de escena
    doc.setFillColor(240, 237, 230);
    doc.rect(M, c.y - 12, PW - M * 2, 22, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(`${s.index}.  ${s.heading}`, M + 6, c.y + 3);
    c.y += 24;

    if (used.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(140, 140, 140);
      doc.text("Sin notas de desglose.", M + 6, c.y);
      c.y += 20;
      return;
    }

    used.forEach((d) => {
      const note = (ds.notes[d.id] ?? "").trim();
      const status = ds.status[d.id] ?? "";
      const lines = wrap(doc, note, PW - M * 2 - 110, 9);
      ensure(c, 16 + lines.length * 11, title);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text(d.label, M + 6, c.y);
      if (status) {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(150, 120, 60);
        doc.text(`[${status}]`, M + 6 + 110, c.y);
      }
      c.y += 12;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      lines.forEach((ln: string) => {
        doc.text(ln, M + 16, c.y);
        c.y += 11;
      });
      c.y += 4;
    });
    c.y += 8;
  });

  doc.save("desglose-tecnico.pdf");
}

/* ---------- Lista de planos ---------- */
export function exportShotListPDF(scenes: SceneBreakdown[], data: DirectionData): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const c: Ctx = { doc, y: header(doc, "Lista de planos", "generado por Claqueta") };
  const cols = [
    { k: "number", w: 36, label: "#" },
    { k: "type", w: 120, label: "Tipo" },
    { k: "angle", w: 70, label: "Ángulo" },
    { k: "move", w: 70, label: "Movimiento" },
    { k: "lens", w: 50, label: "Lente" },
    { k: "duration", w: 44, label: "Dur." },
    { k: "subject", w: 114, label: "Sujeto" },
  ];

  scenes.forEach((s) => {
    const ds = getScene(data, s.heading.toUpperCase().trim());
    if (ds.shots.length === 0) return;
    ensure(c, 50, "Lista de planos");

    doc.setFillColor(240, 237, 230);
    doc.rect(M, c.y - 12, PW - M * 2, 20, "F");
    doc.setFont("courier", "bold");
    doc.setFontSize(10);
    doc.setTextColor(20, 20, 20);
    doc.text(`${s.index}.  ${s.heading}`, M + 6, c.y + 2);
    c.y += 22;

    // cabecera de tabla
    let x = M;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(90, 90, 90);
    cols.forEach((col) => {
      doc.text(col.label, x + 2, c.y);
      x += col.w;
    });
    c.y += 12;

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    ds.shots.forEach((sh) => {
      ensure(c, 14, "Lista de planos");
      x = M;
      cols.forEach((col) => {
        const v = String((sh as any)[col.k] ?? "");
        const lines = wrap(doc, v, col.w - 4, 8);
        doc.text(lines[0] ?? "", x + 2, c.y);
        x += col.w;
      });
      if (sh.shot) {
        doc.setTextColor(46, 158, 91);
        doc.text("✓", PW - M - 8, c.y);
        doc.setTextColor(40, 40, 40);
      }
      c.y += 13;
    });
    c.y += 10;
  });

  doc.save("lista-de-planos.pdf");
}

/* ---------- Plan de rodaje ---------- */
export function exportSchedulePDF(scenes: SceneBreakdown[], schedule: Schedule): void {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const c: Ctx = { doc, y: header(doc, "Plan de rodaje", `${schedule.days.length} día(s) · generado por Claqueta`) };

  schedule.days.forEach((day, di) => {
    ensure(c, 60, "Plan de rodaje");
    doc.setFillColor(58, 80, 107);
    doc.rect(M, c.y - 12, PW - M * 2, 22, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(`Día ${di + 1}`, M + 6, c.y + 3);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(day.date || "", PW - M - 100, c.y + 3);
    c.y += 26;
    doc.setTextColor(30, 30, 30);

    if (day.strips.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setTextColor(140, 140, 140);
      doc.setFontSize(9);
      doc.text("(día vacío)", M + 6, c.y);
      c.y += 18;
      return;
    }

    day.strips.forEach((st) => {
      ensure(c, 16, "Plan de rodaje");
      let label = "";
      let tag = "";
      if (st.kind === "scene") {
        const sc = scenes[st.sceneIndex ?? -1];
        tag = "ESCENA";
        label = sc ? `${st.sceneIndex}. ${sc.heading}` : `Escena ${st.sceneIndex}`;
      } else {
        tag = st.kind === "meal" ? "COMIDA" : st.kind === "move" ? "MOVE" : "NOTA";
        label = st.text ?? "";
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(150, 120, 60);
      doc.text(tag, M + 6, c.y);
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(label, M + 70, c.y);
      c.y += 15;
    });
    c.y += 12;
  });

  doc.save("plan-de-rodaje.pdf");
}
