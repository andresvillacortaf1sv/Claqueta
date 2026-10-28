import { JSDOM } from "jsdom";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  pretendToBeVisual: true,
  url: "http://localhost/",
});
const g = globalThis as any;
g.window = dom.window;
g.document = dom.window.document;
g.localStorage = dom.window.localStorage;
g.HTMLElement = dom.window.HTMLElement;
g.requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(Date.now()), 0);
g.cancelAnimationFrame = (id: number) => clearTimeout(id);

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

async function main() {
  const { EditorState, TextSelection } = await import("prosemirror-state");
  const { EditorView } = await import("prosemirror-view");
  const { screenplayInputRules } = await import("../src/editor/inputrules");
  const { schema } = await import("../src/editor/schema");

  function typeTrigger(initial: string, trigger: string) {
    const doc = schema.node("doc", null, [schema.node("action", null, [schema.text(initial)])]);
    const state = EditorState.create({ doc, plugins: [screenplayInputRules] });
    const view = new EditorView(dom.window.document.getElementById("root")! as any, { state });
    view.dispatch(view.state.tr.setSelection(TextSelection.atEnd(view.state.doc)));
    const { from, to } = view.state.selection;
    const handled = view.someProp("handleTextInput", (f: any) => f(view, from, to, trigger));
    if (!handled) view.dispatch(view.state.tr.insertText(trigger));
    const node = view.state.doc.firstChild!;
    const res = { type: node.type.name, text: node.textContent };
    view.destroy();
    return res;
  }

  // El bug era que "INT." borraba el texto. Ahora debe conservarse.
  const a = typeTrigger("INT", ".");
  check('"INT." → encabezado conservando el texto', a.type === "scene_heading" && a.text === "INT.");
  const b = typeTrigger("EXT", ".");
  check('"EXT." → encabezado conservando el texto', b.type === "scene_heading" && b.text === "EXT.");
  const c = typeTrigger("CORTE A", ":");
  check('"CORTE A:" → transición conservando el texto', c.type === "transition" && c.text === "CORTE A:");
  const d = typeTrigger("Hola mundo", ".");
  check("texto normal con punto no se convierte ni se borra", d.type === "action" && d.text === "Hola mundo.");

  console.log(`\n${passed} pasaron, ${failed} fallaron.`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error("FALLO:", e);
  process.exit(1);
});
