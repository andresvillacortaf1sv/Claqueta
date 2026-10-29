import { useMemo, useRef, useState, useCallback } from "react";
import { Graph, NodeType } from "../lib/graph";
import { layoutGraph } from "../lib/graphLayout";

interface Props {
  graph: Graph;
  onJump: (pos: number) => void;
  onClose: () => void;
}

const W = 1000;
const H = 700;

const TYPE_META: Record<NodeType, { label: string; color: string }> = {
  scene: { label: "Escenas", color: "#c8803a" },
  character: { label: "Personajes", color: "#e05aa0" },
  place: { label: "Lugares", color: "#2e9e5b" },
  object: { label: "Objetos", color: "#c9a21a" },
};

const LINK_COLOR: Record<string, string> = {
  seq: "#6f6960",
  cast: "#e05aa0",
  place: "#2e9e5b",
  object: "#c9a21a",
};

export function NeuralMap({ graph, onJump, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [visible, setVisible] = useState<Record<NodeType, boolean>>({
    scene: true,
    character: true,
    place: true,
    object: true,
  });
  const [labels, setLabels] = useState(true);
  const [seed, setSeed] = useState(1);
  const [, setTick] = useState(0);
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });

  // Layout del grafo COMPLETO (estable al ocultar capas)
  const layout = useMemo(
    () => layoutGraph(graph.nodes, graph.links, { width: W, height: H, seed }),
    [graph, seed],
  );
  const posRef = useRef<Map<string, { x: number; y: number }>>(layout);
  posRef.current = useMemo(() => new Map(layout), [layout]);

  const drag = useRef<{ id: string } | null>(null);
  const pan = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);

  const toClient = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current!.getBoundingClientRect();
      return {
        x: vb.x + ((clientX - rect.left) / rect.width) * vb.w,
        y: vb.y + ((clientY - rect.top) / rect.height) * vb.h,
      };
    },
    [vb],
  );

  const nodeDown = (id: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    drag.current = { id };
  };
  const onMove = (e: React.PointerEvent) => {
    if (drag.current) {
      const p = toClient(e.clientX, e.clientY);
      posRef.current.set(drag.current.id, p);
      setTick((t) => t + 1);
    } else if (pan.current) {
      const rect = svgRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - pan.current.sx) / rect.width) * vb.w;
      const dy = ((e.clientY - pan.current.sy) / rect.height) * vb.h;
      setVb((v) => ({ ...v, x: pan.current!.vx - dx, y: pan.current!.vy - dy }));
    }
  };
  const bgDown = (e: React.PointerEvent) => {
    pan.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
  };
  const onUp = () => {
    drag.current = null;
    pan.current = null;
  };
  const zoom = (factor: number) =>
    setVb((v) => {
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      const w = Math.max(200, Math.min(3000, v.w * factor));
      const h = (w / v.w) * v.h;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });

  const shownNodes = graph.nodes.filter((n) => visible[n.type]);
  const shownIds = new Set(shownNodes.map((n) => n.id));
  const shownLinks = graph.links.filter((l) => shownIds.has(l.source) && shownIds.has(l.target));

  const counts: Record<NodeType, number> = { scene: 0, character: 0, place: 0, object: 0 };
  graph.nodes.forEach((n) => counts[n.type]++);

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Red neuronal">
      <div className="beatboard-bar">
        <span className="beatboard-count">Red neuronal</span>
        <div className="nm-layers">
          {(Object.keys(TYPE_META) as NodeType[]).map((t) => (
            <button
              key={t}
              className={"nm-layer" + (visible[t] ? " is-on" : "")}
              onClick={() => setVisible((v) => ({ ...v, [t]: !v[t] }))}
            >
              <span className="nm-dot" style={{ background: TYPE_META[t].color }} />
              {TYPE_META[t].label} ({counts[t]})
            </button>
          ))}
        </div>
        <button className={"btn-ghost" + (labels ? "" : "")} onClick={() => setLabels((l) => !l)}>
          {labels ? "Ocultar rótulos" : "Mostrar rótulos"}
        </button>
        <button className="btn-ghost" onClick={() => setSeed((s) => s + 1)}>
          Reorganizar
        </button>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="nm-body">
        <svg
          ref={svgRef}
          className="nm-svg"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          onPointerDown={bgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        >
          {shownLinks.map((l, i) => {
            const a = posRef.current.get(l.source);
            const b = posRef.current.get(l.target);
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={LINK_COLOR[l.kind] ?? "#6f6960"}
                strokeWidth={l.kind === "seq" ? 1.4 : 1}
                strokeOpacity={l.kind === "seq" ? 0.5 : 0.35}
              />
            );
          })}
          {shownNodes.map((n) => {
            const p = posRef.current.get(n.id);
            if (!p) return null;
            const r = Math.min(16, 4 + n.degree);
            return (
              <g key={n.id} className="nm-node" onPointerDown={nodeDown(n.id)}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={TYPE_META[n.type].color}
                  onDoubleClick={() => {
                    if (n.type === "scene" && n.pos) {
                      onJump(n.pos);
                      onClose();
                    }
                  }}
                />
                {labels && (
                  <text x={p.x} y={p.y - r - 3} textAnchor="middle" className="nm-label">
                    {n.label.length > 22 ? n.label.slice(0, 21) + "…" : n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="nm-zoom">
          <button onClick={() => zoom(0.85)}>＋</button>
          <button onClick={() => zoom(1.18)}>－</button>
        </div>

        <div className="nm-stats">
          {graph.nodes.length} nodos · {graph.links.length} enlaces · doble clic en una escena para ir al guion · arrastra nodos o el fondo
        </div>
      </div>
    </div>
  );
}
