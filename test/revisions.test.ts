import { EditorState } from "prosemirror-state";
import { schema } from "../src/editor/schema";
import { revisionsPlugin, revisionKey, clearRevisions } from "../src/editor/revisions";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const doc = schema.node("doc", null, [
  schema.node("action", null, [schema.text("hola")]),
]);

let state = EditorState.create({ doc, schema, plugins: [revisionsPlugin()] });

// Sin modo revisión: editar no marca nada.
let s = state.apply(state.tr.insertText("!", 2));
check("Sin modo revisión no se marca", s.doc.firstChild!.attrs.revision === null);

// Activar revisión 'blue' y editar → el bloque queda marcado.
state = state.apply(state.tr.setMeta(revisionKey, { enabled: true, revId: "blue" }));
state = state.apply(state.tr.insertText("x", 2));
check("Editar con modo revisión marca el bloque (blue)", state.doc.firstChild!.attrs.revision === "blue");

// Limpiar marcas.
let cleared = state;
clearRevisions(state, (tr) => {
  cleared = state.apply(tr);
});
check("Limpiar marcas quita la revisión", cleared.doc.firstChild!.attrs.revision === null);

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
