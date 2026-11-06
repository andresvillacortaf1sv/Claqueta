const store = new Map<string,string>();
(globalThis as any).localStorage = { getItem:(k:string)=>store.has(k)?store.get(k)!:null, setItem:(k:string,v:string)=>store.set(k,v), removeItem:(k:string)=>store.delete(k), key:(i:number)=>[...store.keys()][i]??null, get length(){return store.size;} };
import { schema } from "../src/editor/schema";
import { scriptStats } from "../src/lib/analysis";
import { initProjects } from "../src/lib/projects";
import { loadTimeline, saveTimeline, fmtTime } from "../src/lib/beattimeline";
let p=0,f=0; const ck=(n:string,c:boolean)=>{c?p++:f++;console.log(`  ${c?"✓":"✗"} ${n}`);};
initProjects();

const blocks:any[] = [
  {type:"scene_heading",text:"INT. CASA - DÍA"},
  {type:"action",text:"Ana entra despacio a la sala."},
  {type:"character",text:"ANA"},
  {type:"dialogue",text:"Hola, ¿hay alguien?"},
  {type:"scene_heading",text:"EXT. CALLE - NOCHE"},
  {type:"character",text:"BOB"},
  {type:"dialogue",text:"Corre."},
];
void schema;
const st = scriptStats(blocks);
ck("2 escenas", st.scenes===2);
ck("INT=1 EXT=1", st.intCount===1 && st.extCount===1);
ck("Día=1 Noche=1", st.dayCount===1 && st.nightCount===1);
ck("reparto detectado (ANA, BOB)", st.topCharacters.length===2);
ck("ANA con 1 línea", st.topCharacters.find(c=>c.name==="ANA")?.lines===1);

// timeline
const tl = loadTimeline();
ck("timeline arranca vacío", tl.items.length===0 && tl.totalSeconds===6000);
tl.items.push({id:"a",lane:"beat",start:120,duration:60,label:"Detonante"});
saveTimeline(tl);
ck("timeline persiste", loadTimeline().items.length===1);
ck("fmtTime 125 = 02:05", fmtTime(125)==="02:05");
ck("fmtTime 3725 = 1:02:05", fmtTime(3725)==="1:02:05");

console.log(`\n${p} pasaron, ${f} fallaron.`);
process.exit(f===0?0:1);
