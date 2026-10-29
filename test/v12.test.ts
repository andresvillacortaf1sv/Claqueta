const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

import { schema } from "../src/editor/schema";
import { getSceneBreakdown } from "../src/lib/breakdown";
import { addManualCharacter, mergeCharacters } from "../src/lib/manualCharacters";
import { getCharacters } from "../src/lib/characters";
import { addCustomDepartment, allDepartments, removeCustomDepartment } from "../src/lib/direction";
import { loadSchedule, saveSchedule, unassignedScenes, newId } from "../src/lib/schedule";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const sc = (h: string) => schema.node("scene_heading", null, [schema.text(h)]);
const ac = (t: string) => schema.node("action", null, [schema.text(t)]);
const ch = (n: string) => schema.node("character", null, [schema.text(n)]);
const di = (t: string) => schema.node("dialogue", null, [schema.text(t)]);

const doc = schema.node("doc", null, [
  sc("INT. CASA - DÍA"),
  ac("Ana entra despacio."),
  ch("ANA"),
  di("Hola."),
  sc("EXT. CALLE - NOCHE"),
  ac("Llueve."),
]);

// body de escena
{
  const scenes = getSceneBreakdown(doc);
  check("escena incluye su cuerpo (texto)", scenes[0].body.includes("Ana entra despacio") && scenes[0].body.includes("ANA"));
}

// personajes manuales
{
  addManualCharacter("Rodrigo");
  const merged = mergeCharacters(getCharacters(doc));
  const rod = merged.find((c) => c.name === "RODRIGO");
  check("personaje manual aparece fusionado", !!rod && rod.dialogues === 0);
  check("personaje detectado sigue presente", merged.some((c) => c.name === "ANA"));
}

// departamentos personalizados
{
  const before = allDepartments().length;
  addCustomDepartment("Drones");
  check("departamento personalizado se añade", allDepartments().length === before + 1 && allDepartments().some((d) => d.label === "Drones"));
  const id = allDepartments().find((d) => d.label === "Drones")!.id;
  removeCustomDepartment(id);
  check("departamento personalizado se quita", !allDepartments().some((d) => d.label === "Drones"));
}

// plan de rodaje
{
  const total = getSceneBreakdown(doc).length; // 2
  let s = loadSchedule();
  check("plan vacío = todas sin asignar", unassignedScenes(total, s).length === total);
  s = { days: [{ id: newId("d"), date: "2026-10-29", strips: [{ id: newId("s"), kind: "scene", sceneIndex: 0 }] }] };
  saveSchedule(s);
  check("una escena asignada reduce las pendientes", unassignedScenes(total, loadSchedule()).length === total - 1);
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
