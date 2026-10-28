import { EditorState, TextSelection, Command } from "prosemirror-state";
import { Node as PMNode } from "prosemirror-model";
import { schema } from "../src/editor/schema";
import { smartEnter, cycleForward, setElement } from "../src/editor/commands";

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`);
  }
}

function stateFrom(doc: PMNode): EditorState {
  const s = EditorState.create({ doc, schema });
  return s.apply(s.tr.setSelection(TextSelection.atEnd(doc)));
}

function apply(state: EditorState, cmd: Command): EditorState {
  let out = state;
  const ok = cmd(state, (tr) => {
    out = state.apply(tr);
  });
  if (!ok) throw new Error("comando devolvió false");
  return out;
}

function types(doc: PMNode): string[] {
  const t: string[] = [];
  doc.forEach((n) => t.push(n.type.name));
  return t;
}

// 1. Enter tras PERSONAJE crea un DIÁLOGO
{
  const doc = schema.node("doc", null, [
    schema.node("character", null, [schema.text("ANA")]),
  ]);
  const after = apply(stateFrom(doc), smartEnter);
  check("Enter: PERSONAJE → DIÁLOGO", types(after.doc).join(",") === "character,dialogue");
}

// 2. Enter tras TRANSICIÓN crea un ENCABEZADO
{
  const doc = schema.node("doc", null, [
    schema.node("transition", null, [schema.text("CORTE A:")]),
  ]);
  const after = apply(stateFrom(doc), smartEnter);
  check("Enter: TRANSICIÓN → ENCABEZADO", types(after.doc)[1] === "scene_heading");
}

// 3. Enter repetido en línea VACÍA rota el tipo sin crear líneas nuevas
{
  // Acción vacía: Enter → personaje; Enter de nuevo → diálogo
  let st = stateFrom(schema.node("doc", null, [schema.node("action")]));
  st = apply(st, smartEnter);
  const t1 = types(st.doc).join(",");
  st = apply(st, smartEnter);
  const t2 = types(st.doc).join(",");
  check(
    "Enter vacío rota ACCIÓN → PERSONAJE → DIÁLOGO sin partir",
    t1 === "character" && t2 === "dialogue",
  );
}

// 4. Tab cicla ACCIÓN → PERSONAJE
{
  const doc = schema.node("doc", null, [
    schema.node("action", null, [schema.text("hola")]),
  ]);
  const after = apply(stateFrom(doc), cycleForward);
  check("Tab: ACCIÓN → PERSONAJE", types(after.doc)[0] === "character");
}

// 5. setElement cambia el tipo preservando el texto
{
  const doc = schema.node("doc", null, [
    schema.node("action", null, [schema.text("INT. CASA")]),
  ]);
  const after = apply(stateFrom(doc), setElement("scene_heading"));
  check(
    "setElement: ACCIÓN → ENCABEZADO conserva texto",
    types(after.doc)[0] === "scene_heading" && after.doc.firstChild!.textContent === "INT. CASA",
  );
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
