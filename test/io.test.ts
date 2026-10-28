import { blocksToFdx, fdxToBlocks } from "../src/lib/fdx";
import { blocksToFountain, fountainToBlocks } from "../src/lib/fountain";
import { Block } from "../src/lib/serialize";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const guion: Block[] = [
  { type: "scene_heading", text: "INT. CAFÉ - DÍA" },
  { type: "action", text: "Andrés teclea en su laptop." },
  { type: "character", text: "ANDRÉS" },
  { type: "parenthetical", text: "(sonriendo)" },
  { type: "dialogue", text: "Hoy sí termino el editor." },
  { type: "transition", text: "CORTE A:" },
  { type: "action", text: "La ciudad despierta." },
];

function sig(b: Block[]): string {
  return b.map((x) => `${x.type}:${x.text.toUpperCase().trim()}`).join("|");
}

// FDX round-trip
{
  const xml = blocksToFdx(guion);
  const back = fdxToBlocks(xml);
  check("FDX es XML de FinalDraft", xml.includes("<FinalDraft") && xml.includes("Scene Heading"));
  check("FDX ida y vuelta conserva el guion", sig(back) === sig(guion));
}

// FDX: "General" se mapea a acción y entidades se descodifican
{
  const xml =
    '<FinalDraft><Content>' +
    '<Paragraph Type="General"><Text>Nota &amp; prueba</Text></Paragraph>' +
    '<Paragraph Type="Scene Heading"><Text>EXT. CALLE - NOCHE</Text></Paragraph>' +
    "</Content></FinalDraft>";
  const b = fdxToBlocks(xml);
  check(
    "FDX: General→acción y entidades XML",
    b.length === 2 && b[0].type === "action" && b[0].text === "Nota & prueba" && b[1].type === "scene_heading",
  );
}

// Fountain round-trip (comparando en mayúsculas por los elementos que se fuerzan)
{
  const ft = blocksToFountain(guion);
  const back = fountainToBlocks(ft);
  check("Fountain contiene el personaje en MAYÚSCULAS", ft.includes("ANDRÉS"));
  check("Fountain marca la transición con '>'", /^>\s*CORTE A:/m.test(ft));
  check("Fountain ida y vuelta conserva tipos y texto", sig(back) === sig(guion));
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
