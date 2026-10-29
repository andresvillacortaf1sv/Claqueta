import { diffLines, diffStats } from "../src/lib/diff";
import { parseHeading, getLocations } from "../src/lib/locations";
import { buildRegex } from "../src/editor/findReplace";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

// diff
{
  const ops = diffLines(["a", "b", "c"], ["a", "x", "c"]);
  const kinds = ops.map((o) => `${o.kind}:${o.text}`).join("|");
  check("diff detecta cambios", kinds === "equal:a|del:b|add:x|equal:c");
  const st = diffStats(ops);
  check("diff stats +1/−1", st.added === 1 && st.removed === 1);
}

// lugares
{
  const p = parseHeading("INT. CAFÉ DE BARRIO - DÍA");
  check("parseHeading INT/lugar/tiempo", p.ie === "INT." && p.place === "CAFÉ DE BARRIO" && p.time === "DÍA");
  const locs = getLocations(["INT. CASA - DÍA", "EXT. CASA - NOCHE", "INT. BAR - NOCHE"]);
  const casa = locs.find((l) => l.place === "CASA")!;
  check("getLocations agrupa CASA (2 escenas, 1 int, 1 ext)", casa.scenes === 2 && casa.interiors === 1 && casa.exteriors === 1);
}

// buscar: regex builder
{
  const rCase = buildRegex("ana", { element: "all", caseSensitive: true, wholeWord: false, regex: false })!;
  check("case-sensitive no cuenta ANA", "ANA y ana".match(rCase)!.length === 1);
  const rWhole = buildRegex("ana", { element: "all", caseSensitive: false, wholeWord: true, regex: false })!;
  check("palabra completa no cuenta 'banana'", ("banana ana".match(rWhole) || []).length === 1);
  const rRegex = buildRegex("a.a", { element: "all", caseSensitive: false, wholeWord: false, regex: true })!;
  check("regex funciona", ("aza ala".match(rRegex) || []).length === 2);
  const bad = buildRegex("(", { element: "all", caseSensitive: false, wholeWord: false, regex: true });
  check("regex inválida devuelve null", bad === null);
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
