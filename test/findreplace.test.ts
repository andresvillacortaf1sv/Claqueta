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
  const { EditorState } = await import("prosemirror-state");
  const { EditorView } = await import("prosemirror-view");
  const { schema } = await import("../src/editor/schema");
  const { replaceAll, countMatches } = await import("../src/editor/findReplace");

  function makeView() {
    const doc = schema.node("doc", null, [
      schema.node("action", null, [schema.text("hola mundo hola")]),
      schema.node("dialogue", null, [schema.text("hola amigo")]),
    ]);
    const state = EditorState.create({ doc });
    return new EditorView(dom.window.document.getElementById("root")! as any, { state });
  }

  const optsAll = { element: "all" as const, caseSensitive: false, wholeWord: false, regex: false };
  const optsDlg = { element: "dialogue" as const, caseSensitive: false, wholeWord: false, regex: false };

  let view = makeView();
  check("countMatches cuenta 3 'hola'", countMatches(view.state, "hola", optsAll) === 3);
  const n = replaceAll(view, "hola", "adiós", optsAll);
  check("replaceAll reemplaza 3", n === 3);
  check("texto reemplazado en ambos bloques", view.state.doc.textContent.includes("adiós mundo adiós") && view.state.doc.textContent.includes("adiós amigo"));
  view.destroy();

  view = makeView();
  const n2 = replaceAll(view, "hola", "adiós", optsDlg);
  check("replaceAll por tipo (sólo diálogo) reemplaza 1", n2 === 1);
  check("acción intacta", view.state.doc.firstChild!.textContent === "hola mundo hola");
  view.destroy();

  console.log(`\n${passed} pasaron, ${failed} fallaron.`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((e) => {
  console.error("FALLO:", e);
  process.exit(1);
});
