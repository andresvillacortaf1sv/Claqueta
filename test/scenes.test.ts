import { Fragment } from "prosemirror-model";
import { schema } from "../src/editor/schema";
import { getScenes, sceneGroups } from "../src/lib/scenes";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

function sc(h: string) {
  return schema.node("scene_heading", null, [schema.text(h)]);
}
function ac(t: string) {
  return schema.node("action", null, [schema.text(t)]);
}

const doc = schema.node("doc", null, [
  ac("Preámbulo antes de la primera escena."),
  sc("INT. CASA - DÍA"),
  ac("Ana entra."),
  sc("EXT. CALLE - NOCHE"),
  ac("Llueve."),
  sc("INT. BAR - NOCHE"),
  ac("Suena jazz."),
]);

// getScenes
{
  const scenes = getScenes(doc);
  check("Detecta 3 escenas", scenes.length === 3);
  check("Encabezados correctos", scenes.map((s) => s.heading).join("|") === "INT. CASA - DÍA|EXT. CALLE - NOCHE|INT. BAR - NOCHE");
  check("Sinopsis = primera acción de la escena", scenes[0].synopsis === "Ana entra.");
  check("Numeración 1,2,3", scenes.map((s) => s.order).join(",") === "0,1,2");
}

// reordenado (replicando la lógica de reorderScenes sin vista)
{
  const { preamble, scenes } = sceneGroups(doc);
  const arr = scenes.slice();
  const [moved] = arr.splice(0, 1); // mover escena 1 (CASA)
  arr.splice(2, 0, moved); // al final
  const children = [...preamble, ...arr.flat()];
  const newDoc = schema.node("doc", null, Fragment.fromArray(children));
  const headings = getScenes(newDoc).map((s) => s.heading).join("|");
  check("Preámbulo se conserva al inicio", newDoc.firstChild!.textContent.startsWith("Preámbulo"));
  check("Reordenado mueve la escena al final", headings === "EXT. CALLE - NOCHE|INT. BAR - NOCHE|INT. CASA - DÍA");
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
