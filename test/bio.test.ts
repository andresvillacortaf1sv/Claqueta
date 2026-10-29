// Polyfill mínimo de localStorage para Node
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
};

import { loadBio, saveBio, loadAllBios, MEDIDORES, MISC_QUESTIONS } from "../src/lib/characterBio";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

// Defaults
{
  const bio = loadBio("ANA");
  check("medidores por defecto = 50", MEDIDORES.every((m) => bio.medidores[m.id] === 50));
  check("miscelánea tiene todas las preguntas", MISC_QUESTIONS.every((q) => q.id in bio.miscelanea));
  check("relaciones vacías por defecto", bio.relaciones.length === 0);
}

// Guardar y recuperar
{
  const bio = loadBio("ANA");
  bio.logline = "Detective que no cree en nada";
  bio.medidores.empatia = 80;
  bio.relaciones.push({ id: "r1", to: "BOB", type: "conflicto", note: "lo persigue" });
  saveBio(bio);

  const back = loadBio("ANA");
  check("logline persiste", back.logline === "Detective que no cree en nada");
  check("medidor editado persiste", back.medidores.empatia === 80);
  check("relación persiste", back.relaciones.length === 1 && back.relaciones[0].to === "BOB");
}

// loadAllBios
{
  const all = loadAllBios();
  check("loadAllBios encuentra el personaje", all.some((b) => b.name.toUpperCase() === "ANA"));
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
