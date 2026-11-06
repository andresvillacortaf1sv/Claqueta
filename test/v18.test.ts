const store = new Map<string,string>();
(globalThis as any).localStorage = {
  getItem:(k:string)=>store.has(k)?store.get(k)!:null,
  setItem:(k:string,v:string)=>store.set(k,v),
  removeItem:(k:string)=>store.delete(k),
  key:(i:number)=>[...store.keys()][i]??null,
  get length(){return store.size;}
};

import { EditorState, TextSelection } from "prosemirror-state";
import { schema } from "../src/editor/schema";
import { highlightSelection, clearHighlightSelection } from "../src/editor/revisions";
import { initProjects, createProject, setActiveProject, getActiveId, listProjects, pkey, deleteProject } from "../src/lib/projects";

let passed=0,failed=0;
function check(n:string,c:boolean){c?passed++:failed++;console.log(`  ${c?"✓":"✗"} ${n}`);}

// Resaltado inline por selección
{
  const doc = schema.node("doc",null,[schema.node("action",null,[schema.text("hola mundo cruel")])]);
  let st = EditorState.create({doc,schema});
  // seleccionar "mundo" (posiciones 6..11 dentro del texto: doc pos 1 = inicio texto)
  st = st.apply(st.tr.setSelection(TextSelection.create(st.doc, 6, 11)));
  let out = st;
  highlightSelection("pink")(st,(tr)=>{out=st.apply(tr);});
  const mark = out.doc.firstChild!.child(1); // el fragmento con marca
  const hasHl = out.doc.rangeHasMark(6,11,schema.marks.highlight);
  check("resalta sólo la selección (palabra)", hasHl);
  check("no resalta fuera de la selección", !out.doc.rangeHasMark(1,6,schema.marks.highlight));
  void mark;
  // limpiar
  let cleared = out;
  clearHighlightSelection(out,(tr)=>{cleared=out.apply(tr);});
  check("quitar resaltado funciona", !cleared.doc.rangeHasMark(6,11,schema.marks.highlight));
}

// Documentos múltiples: aislamiento por proyecto
{
  initProjects(); // crea "Mi guion"
  const a = getActiveId();
  localStorage.setItem(pkey("documento"), JSON.stringify({a:1}));
  const b = createProject("Segundo");
  setActiveProject(b.id);
  check("proyecto nuevo arranca vacío", localStorage.getItem(pkey("documento")) === null);
  localStorage.setItem(pkey("documento"), JSON.stringify({b:2}));
  setActiveProject(a);
  check("cada documento guarda lo suyo", localStorage.getItem(pkey("documento")) === JSON.stringify({a:1}));
  check("hay 2 proyectos", listProjects().length === 2);
  deleteProject(b.id);
  check("borrar proyecto lo quita", listProjects().length === 1);
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed===0?0:1);
