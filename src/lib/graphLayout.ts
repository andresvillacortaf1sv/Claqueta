/**
 * Disposición force-directed (Fruchterman–Reingold simplificado). Función pura:
 * recibe nodos y enlaces y devuelve posiciones. La usa la red neuronal.
 */
export interface LayoutNode {
  id: string;
  degree: number;
}
export interface LayoutLink {
  source: string;
  target: string;
}
export interface Pos {
  x: number;
  y: number;
}

export interface LayoutOptions {
  width?: number;
  height?: number;
  iterations?: number;
  separation?: number; // 0.5–2
  seed?: number;
}

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function layoutGraph(
  nodes: LayoutNode[],
  links: LayoutLink[],
  opts: LayoutOptions = {},
): Map<string, Pos> {
  const W = opts.width ?? 1000;
  const H = opts.height ?? 700;
  const iterations = opts.iterations ?? 400;
  const sep = opts.separation ?? 1;
  const rnd = mulberry32(opts.seed ?? 12345);

  const n = nodes.length;
  const pos = new Map<string, Pos>();
  if (n === 0) return pos;

  const area = W * H;
  const k = Math.sqrt(area / n) * sep;

  // posiciones iniciales en espiral aleatoria
  nodes.forEach((nd, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = (0.15 + 0.35 * rnd()) * Math.min(W, H);
    pos.set(nd.id, { x: W / 2 + r * Math.cos(a), y: H / 2 + r * Math.sin(a) });
  });

  const idx = new Map(nodes.map((nd, i) => [nd.id, i]));
  let temp = W / 10;
  const cool = temp / (iterations + 1);

  for (let it = 0; it < iterations; it++) {
    const disp = nodes.map(() => ({ x: 0, y: 0 }));

    // repulsión (todos contra todos)
    for (let i = 0; i < n; i++) {
      const pi = pos.get(nodes[i].id)!;
      for (let j = i + 1; j < n; j++) {
        const pj = pos.get(nodes[j].id)!;
        let dx = pi.x - pj.x;
        let dy = pi.y - pj.y;
        let d = Math.hypot(dx, dy) || 0.01;
        const f = (k * k) / d;
        dx = (dx / d) * f;
        dy = (dy / d) * f;
        disp[i].x += dx;
        disp[i].y += dy;
        disp[j].x -= dx;
        disp[j].y -= dy;
      }
    }

    // atracción (enlaces)
    for (const l of links) {
      const si = idx.get(l.source);
      const ti = idx.get(l.target);
      if (si === undefined || ti === undefined) continue;
      const ps = pos.get(l.source)!;
      const pt = pos.get(l.target)!;
      let dx = ps.x - pt.x;
      let dy = ps.y - pt.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d * d) / k;
      dx = (dx / d) * f;
      dy = (dy / d) * f;
      disp[si].x -= dx;
      disp[si].y -= dy;
      disp[ti].x += dx;
      disp[ti].y += dy;
    }

    // mover con límite de temperatura + gravedad al centro
    for (let i = 0; i < n; i++) {
      const p = pos.get(nodes[i].id)!;
      disp[i].x += (W / 2 - p.x) * 0.012;
      disp[i].y += (H / 2 - p.y) * 0.012;
      const d = Math.hypot(disp[i].x, disp[i].y) || 0.01;
      const m = Math.min(d, temp);
      p.x += (disp[i].x / d) * m;
      p.y += (disp[i].y / d) * m;
      p.x = Math.max(20, Math.min(W - 20, p.x));
      p.y = Math.max(20, Math.min(H - 20, p.y));
    }
    temp = Math.max(1, temp - cool);
  }

  return pos;
}
