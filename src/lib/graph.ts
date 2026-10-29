/**
 * Construye el grafo estructural del guion (la "red neuronal"): escenas,
 * personajes, lugares y objetos como nodos, con enlaces según qué aparece en
 * cada escena y la secuencia de escenas.
 */
import { Node as PMNode } from "prosemirror-model";
import { getSceneBreakdown, sceneKey } from "./breakdown";
import { BreakdownData, CATEGORIES, splitItems } from "./breakdownStore";

export type NodeType = "scene" | "character" | "place" | "object";

export interface GNode {
  id: string;
  type: NodeType;
  label: string;
  pos: number; // posición en el documento (para saltar); 0 si no aplica
  degree: number;
}

export interface GLink {
  source: string;
  target: string;
  kind: "seq" | "cast" | "place" | "object";
}

export interface Graph {
  nodes: GNode[];
  links: GLink[];
}

export function buildGraph(doc: PMNode, breakdown: BreakdownData): Graph {
  const scenes = getSceneBreakdown(doc);
  const nodeMap = new Map<string, GNode>();
  const links: GLink[] = [];

  const ensure = (id: string, type: NodeType, label: string, pos = 0) => {
    if (!nodeMap.has(id)) nodeMap.set(id, { id, type, label, pos, degree: 0 });
    return nodeMap.get(id)!;
  };

  scenes.forEach((s, i) => {
    const sid = `s:${i}`;
    ensure(sid, "scene", `${i + 1}. ${s.place || s.heading}`, s.pos);

    // escena → escena (secuencia)
    if (i > 0) links.push({ source: `s:${i - 1}`, target: sid, kind: "seq" });

    // escena → lugar
    if (s.place) {
      const pid = `p:${s.place}`;
      ensure(pid, "place", s.place);
      links.push({ source: sid, target: pid, kind: "place" });
    }

    // escena → personajes
    for (const c of s.cast) {
      const cid = `c:${c}`;
      ensure(cid, "character", c);
      links.push({ source: sid, target: cid, kind: "cast" });
    }

    // escena → objetos (del desglose manual)
    const el = breakdown[sceneKey(s.heading)] ?? {};
    for (const cat of CATEGORIES) {
      if (cat.id === "notas") continue;
      for (const item of splitItems(el[cat.id])) {
        const oid = `o:${item.toUpperCase()}`;
        ensure(oid, "object", item);
        links.push({ source: sid, target: oid, kind: "object" });
      }
    }
  });

  // grado
  for (const l of links) {
    const a = nodeMap.get(l.source);
    const b = nodeMap.get(l.target);
    if (a) a.degree++;
    if (b) b.degree++;
  }

  return { nodes: [...nodeMap.values()], links };
}
