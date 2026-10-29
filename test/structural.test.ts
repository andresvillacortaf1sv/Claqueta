import { schema } from "../src/editor/schema";
import { buildGraph } from "../src/lib/graph";
import { layoutGraph } from "../src/lib/graphLayout";
import { heuristicAnalysis } from "../src/lib/analysis";
import { extractJson } from "../src/lib/ai";
import { Block } from "../src/lib/serialize";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const sc = (h: string) => schema.node("scene_heading", null, [schema.text(h)]);
const ch = (n: string) => schema.node("character", null, [schema.text(n)]);
const di = (t: string) => schema.node("dialogue", null, [schema.text(t)]);
const ac = (t: string) => schema.node("action", null, [schema.text(t)]);

const doc = schema.node("doc", null, [
  sc("INT. CASA - DÍA"),
  ac("Ana entra."),
  ch("ANA"),
  di("Hola."),
  sc("EXT. CALLE - NOCHE"),
  ch("BOB"),
  di("¡Corre!"),
]);

// Grafo
{
  const g = buildGraph(doc, {});
  const types = g.nodes.reduce<Record<string, number>>((a, n) => ((a[n.type] = (a[n.type] || 0) + 1), a), {});
  check("2 nodos de escena", types.scene === 2);
  check("2 personajes (ANA, BOB)", types.character === 2);
  check("2 lugares (CASA, CALLE)", types.place === 2);
  check("hay enlace de secuencia escena→escena", g.links.some((l) => l.kind === "seq"));
  check("hay enlaces de reparto y lugar", g.links.some((l) => l.kind === "cast") && g.links.some((l) => l.kind === "place"));
}

// Layout
{
  const g = buildGraph(doc, {});
  const pos = layoutGraph(g.nodes, g.links, { width: 800, height: 600, iterations: 120 });
  check("layout posiciona todos los nodos", pos.size === g.nodes.length);
  check("posiciones dentro de los límites", [...pos.values()].every((p) => p.x >= 0 && p.x <= 800 && p.y >= 0 && p.y <= 600));
}

// Análisis heurístico
{
  const blocks: Block[] = [];
  doc.forEach((nd) => blocks.push({ type: nd.type.name as any, text: nd.textContent }));
  const a = heuristicAnalysis(blocks);
  check("análisis: una métrica por escena", a.scenes.length === 2);
  check("métricas en rango 0-100", a.scenes.every((s) => s.intensity >= 0 && s.intensity <= 100 && s.tension <= 100));
  check("estructura cubre escenas", a.structure.length > 0);
}

// Parser JSON de IA
{
  const fenced = 'Aquí tienes:\n```json\n{"resumen":"ok","escenas":[]}\n```\nfin';
  check("extractJson con fences", extractJson(fenced).resumen === "ok");
  check("extractJson crudo", extractJson('ruido {"a":1} más ruido').a === 1);
  let threw = false;
  try {
    extractJson("sin json");
  } catch {
    threw = true;
  }
  check("extractJson lanza si no hay JSON", threw);
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
