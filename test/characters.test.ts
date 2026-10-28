import { schema } from "../src/editor/schema";
import { getCharacters } from "../src/lib/characters";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

const sc = (h: string) => schema.node("scene_heading", null, [schema.text(h)]);
const ch = (n: string) => schema.node("character", null, [schema.text(n)]);
const di = (t: string) => schema.node("dialogue", null, [schema.text(t)]);

const doc = schema.node("doc", null, [
  sc("INT. CASA - DÍA"),
  ch("ANA"),
  di("Hola mundo"), // 2 palabras
  ch("BOB"),
  di("Sí"), // 1 palabra
  sc("EXT. CALLE - NOCHE"),
  ch("ANA (CONT'D)"), // misma ANA
  di("Otra vez aquí"), // 3 palabras
]);

const chars = getCharacters(doc);

check("Detecta 2 personajes", chars.length === 2);
check("Ordena por parlamentos (ANA primero)", chars[0].name === "ANA");

const ana = chars.find((c) => c.name === "ANA")!;
const bob = chars.find((c) => c.name === "BOB")!;

check("ANA: 2 parlamentos", ana.dialogues === 2);
check("ANA: 5 palabras", ana.words === 5);
check("ANA: 2 escenas (agrupa CONT'D)", ana.scenes === 2);
check("BOB: 1 parlamento, 1 escena", bob.dialogues === 1 && bob.scenes === 1);

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
