import { parseHeading, getLocations } from "../src/lib/locations";
import { scriptStats } from "../src/lib/analysis";
let p=0,f=0; const ck=(n:string,c:boolean)=>{c?p++:f++;console.log(`  ${c?"✓":"✗"} ${n}`);};

// INT/EXT y EXT/INT
{
  const a = parseHeading("INT/EXT. CARRO - DÍA");
  ck("INT/EXT se reconoce", a.ie === "INT/EXT." && a.place === "CARRO" && a.time === "DÍA");
  const b = parseHeading("EXT/INT. CASA - NOCHE");
  ck("EXT/INT se reconoce", b.ie === "EXT/INT." && b.place === "CASA");
  const locs = getLocations(["INT/EXT. CARRO - DÍA", "INT. CARRO - NOCHE"]);
  const carro = locs.find(l=>l.place==="CARRO")!;
  ck("CARRO agrupa 2 escenas, 1 interior (de la INT) + combinada", carro.scenes===2);
}

// análisis cuenta INT/EXT como ambos
{
  const blocks:any[] = [
    {type:"scene_heading",text:"INT/EXT. CARRO - DÍA"},
    {type:"action",text:"Van conduciendo."},
  ];
  const st = scriptStats(blocks);
  ck("INT/EXT cuenta como INT y EXT", st.intCount===1 && st.extCount===1);
}

console.log(`\n${p} pasaron, ${f} fallaron.`);
process.exit(f===0?0:1);
