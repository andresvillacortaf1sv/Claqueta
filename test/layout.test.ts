import { paginate, LINES_PER_PAGE, Page } from "../src/lib/layout";
import { Block } from "../src/lib/serialize";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

function textLines(pages: Page[]): string[] {
  const out: string[] = [];
  for (const p of pages)
    for (const l of p.lines) if (l.kind === "text") out.push(l.text);
  return out;
}

// 1. Documento corto → 1 página, sin línea en blanco al inicio
{
  const blocks: Block[] = [
    { type: "scene_heading", text: "INT. CASA - DÍA" },
    { type: "action", text: "Una acción breve." },
    { type: "character", text: "ANA" },
    { type: "dialogue", text: "Hola." },
  ];
  const pages = paginate(blocks);
  const firstIsText = pages[0].lines[0].kind === "text";
  check("Doc corto = 1 página", pages.length === 1);
  check("No empieza con línea en blanco", firstIsText);
}

// 2. Ninguna página excede el límite de líneas
{
  const blocks: Block[] = [];
  for (let i = 0; i < 40; i++) {
    blocks.push({ type: "scene_heading", text: `INT. LUGAR ${i} - DÍA` });
    blocks.push({ type: "action", text: "Acción. ".repeat(30) });
  }
  const pages = paginate(blocks);
  const maxLines = Math.max(...pages.map((p) => p.lines.length));
  check(`Múltiples páginas (${pages.length})`, pages.length > 3);
  check(`Ninguna página pasa de ${LINES_PER_PAGE} líneas (máx ${maxLines})`, maxLines <= LINES_PER_PAGE);
}

// 3. Acción larga: no se pierde ni se duplica texto al partir
{
  const line = "El plano se abre sobre la ciudad dormida bajo la niebla gris.";
  const blocks: Block[] = Array.from({ length: 120 }, () => ({
    type: "action" as const,
    text: line,
  }));
  const pages = paginate(blocks);
  const joined = textLines(pages).join(" ");
  // Cada bloque aporta sus palabras; comprobamos que el total de "ciudad" coincide.
  const count = (joined.match(/ciudad/g) || []).length;
  check("Acción larga conserva todo el texto (120×)", count === 120);
}

// 4. Diálogo que cruza de página → (MÁS) al pie y PERSONAJE (CONT'D) arriba
{
  const blocks: Block[] = [
    { type: "scene_heading", text: "INT. SALA - NOCHE" },
    { type: "character", text: "ANA" },
    { type: "dialogue", text: "Palabra ".repeat(600) }, // muy largo: se parte seguro
  ];
  const pages = paginate(blocks);
  const all = textLines(pages);
  const hasMas = all.some((t) => t === "(MÁS)");
  const hasContd = all.some((t) => t === "ANA (CONT'D)");
  check("Diálogo partido inserta (MÁS)", hasMas);
  check("Diálogo partido reanuda con ANA (CONT'D)", hasContd);
  check("El diálogo largo ocupa varias páginas", pages.length > 1);
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
