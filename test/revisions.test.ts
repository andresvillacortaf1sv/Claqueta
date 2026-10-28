import { EditorState, TextSelection } from "prosemirror-state";
import { schema } from "../src/editor/schema";
import { revisionsPlugin, revisionKey, clearRevisions, applyRevision } from "../src/editor/revisions";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const doc = schema.node("doc", null, [schema.node("action", null, [schema.text("hola")])]);
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

// applyRevision marca los bloques que toca la selección.
{
  const d = schema.node("doc", null, [
    schema.node("action", null, [schema.text("uno")]),
    schema.node("action", null, [schema.text("dos")]),
    schema.node("action", null, [schema.text("tres")]),
  ]);
  let st = EditorState.create({ doc: d, schema });
  st = st.apply(st.tr.setSelection(TextSelection.create(st.doc, 2, 7))); // del bloque 1 al 2
  let out = st;
  applyRevision("salmon")(st, (tr) => {
    out = st.apply(tr);
  });
  const revs = [0, 1, 2].map((i) => out.doc.child(i).attrs.revision);
  check(
    "applyRevision marca los bloques seleccionados",
    revs[0] === "salmon" && revs[1] === "salmon" && revs[2] === null,
  );
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
