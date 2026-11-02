import { JSDOM } from "jsdom";
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { pretendToBeVisual: true, url: "http://localhost/" });
const g = globalThis as any;
g.window = dom.window; g.document = dom.window.document; g.localStorage = dom.window.localStorage; g.HTMLElement = dom.window.HTMLElement;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

let passed = 0, failed = 0;
function check(name: string, cond: boolean) { cond ? passed++ : failed++; console.log(`  ${cond ? "✓" : "✗"} ${name}`); }

async function main() {
  const { EditorState, TextSelection } = await import("prosemirror-state");
  const { EditorView } = await import("prosemirror-view");
  const { history } = await import("prosemirror-history");
  const { schema } = await import("../src/editor/schema");
  const { screenplayKeymap, baseKeymapPlugin } = await import("../src/editor/keymap");
  const { screenplayInputRules } = await import("../src/editor/inputrules");
  const { revisionsPlugin } = await import("../src/editor/revisions");
  const { contdPlugin } = await import("../src/editor/contd");
  const { autocompletePlugin, autocompleteKeymap } = await import("../src/editor/autocomplete");
  const { notesPlugin, addNote, getNotes, updateNote } = await import("../src/editor/notes");
  const { setElement, appendCharacterExtension } = await import("../src/editor/commands");

  function mk(doc: any) {
    const state = EditorState.create({ doc, plugins: [history(), screenplayInputRules, autocompleteKeymap, screenplayKeymap, baseKeymapPlugin, revisionsPlugin(), contdPlugin(), autocompletePlugin(), notesPlugin()] });
    return new EditorView(dom.window.document.getElementById("root")! as any, { state });
  }

  // 1. Paréntesis auto: setElement('parenthetical') en bloque vacío inserta "()"
  {
    const doc = schema.node("doc", null, [schema.node("action")]);
    const view = mk(doc);
    view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
    setElement("parenthetical")(view.state, view.dispatch);
    const b = view.state.doc.firstChild!;
    check("Paréntesis auto inserta ()", b.type.name === "parenthetical" && b.textContent === "()");
    view.destroy();
  }

  // 2. appendCharacterExtension añade (V.O.)
  {
    const doc = schema.node("doc", null, [schema.node("character", null, [schema.text("ANA")])]);
    const view = mk(doc);
    view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
    appendCharacterExtension("V.O.")(view.state, view.dispatch);
    check("V.O. añadido al personaje", view.state.doc.firstChild!.textContent === "ANA (V.O.)");
    // no duplica
    appendCharacterExtension("V.O.")(view.state, view.dispatch);
    check("V.O. no se duplica", (view.state.doc.firstChild!.textContent.match(/V\.O\./g)||[]).length === 1);
    view.destroy();
  }

  // 3. CONT'D decoración cuando mismo personaje habla tras acción
  {
    const doc = schema.node("doc", null, [
      schema.node("scene_heading", null, [schema.text("INT. A - DÍA")]),
      schema.node("character", null, [schema.text("ANA")]),
      schema.node("dialogue", null, [schema.text("Hola.")]),
      schema.node("action", null, [schema.text("Se mueve.")]),
      schema.node("character", null, [schema.text("ANA")]),
      schema.node("dialogue", null, [schema.text("Adiós.")]),
    ]);
    const view = mk(doc);
    const html = (view.dom as HTMLElement).innerHTML;
    check("CONT'D aparece en el 2º ANA", html.includes("(CONT'D)"));
    view.destroy();
  }

  // 4. Notas: añadir y actualizar persiste en el estado
  {
    const doc = schema.node("doc", null, [schema.node("action", null, [schema.text("hola mundo")])]);
    const view = mk(doc);
    view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
    const id = addNote(view);
    updateNote(view, id, "revisar esto");
    const notes = getNotes(view.state);
    check("nota creada y con texto", notes.length === 1 && notes[0].text === "revisar esto");
    // La posición debe remapearse al editar el documento (la nota sigue al texto).
    const posBefore = getNotes(view.state)[0].pos;
    view.dispatch(view.state.tr.insertText("XX", 1));
    check("posición de la nota se remapea al editar", getNotes(view.state)[0].pos === posBefore + 2);
    view.destroy();
  }

  console.log(`\n${passed} pasaron, ${failed} fallaron.`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => { console.error("FALLO:", e); process.exit(1); });
