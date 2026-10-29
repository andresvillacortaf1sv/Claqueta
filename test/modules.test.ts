// Polyfill localStorage
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

import { loadBoards, saveBoards, defaultBoard } from "../src/lib/board";
import {
  loadDirection,
  saveDirection,
  getScene,
  emptyShot,
  DEPARTMENTS,
  SHOT_TYPES,
} from "../src/lib/direction";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean) {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "✓" : "✗"} ${name}`);
}

// Pizarra
{
  const boards = loadBoards();
  check("loadBoards devuelve al menos una pizarra", boards.length >= 1);
  const b = defaultBoard();
  b.cards.push({ id: "c1", kind: "hito", text: "inicio", x: 10, y: 10, color: "#2e9e5b", date: "2026-01" });
  saveBoards([b]);
  const back = loadBoards();
  check("pizarra persiste con su tarjeta", back[0].cards.length === 1 && back[0].cards[0].kind === "hito");
}

// Dirección
{
  check("hay 11 departamentos", DEPARTMENTS.length === 11);
  check("tipos de plano incluyen primer plano", SHOT_TYPES.some((t) => t.includes("Primer plano")));

  const data = loadDirection();
  const key = "INT. CASA - DÍA";
  const scene = getScene(data, key);
  scene.notes.arte = "paredes rojas";
  scene.status.arte = "En progreso";
  scene.shots.push(emptyShot(1));
  saveDirection({ ...data, [key]: scene });

  const back = loadDirection();
  check("notas de departamento persisten", back[key].notes.arte === "paredes rojas");
  check("estado de departamento persiste", back[key].status.arte === "En progreso");
  check("plano persiste con su número", back[key].shots.length === 1 && back[key].shots[0].number === "1");
}

console.log(`\n${passed} pasaron, ${failed} fallaron.`);
process.exit(failed === 0 ? 0 : 1);
