import { useMemo } from "react";
import { loadAllBios, RELATION_TYPES, relationColor } from "../lib/characterBio";

interface Props {
  names: string[]; // personajes detectados en el guion
  onOpenBio: (name: string) => void;
  onClose: () => void;
}

const W = 920;
const H = 620;

export function RelationMap({ names, onOpenBio, onClose }: Props) {
  const { nodes, edges } = useMemo(() => {
    const bios = loadAllBios();
    const set = new Set<string>();
    names.forEach((n) => set.add(n.toUpperCase()));
    bios.forEach((b) => {
      set.add(b.name.toUpperCase());
      b.relaciones.forEach((r) => r.to && set.add(r.to.toUpperCase()));
    });
    const list = [...set];

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) / 2 - 90;
    const pos = new Map<string, { x: number; y: number }>();
    list.forEach((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(1, list.length) - Math.PI / 2;
      pos.set(n, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    });

    const edges = bios.flatMap((b) =>
      b.relaciones
        .filter((r) => r.to)
        .map((r) => ({ from: b.name.toUpperCase(), to: r.to.toUpperCase(), type: r.type, note: r.note })),
    );

    return { nodes: list.map((n) => ({ name: n, ...pos.get(n)! })), edges };
  }, [names]);

  const posOf = (name: string) => nodes.find((n) => n.name === name);

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Mapa relacional">
      <div className="beatboard-bar">
        <span className="beatboard-count">Mapa relacional</span>
        <div className="relmap-legend">
          {RELATION_TYPES.map((t) => (
            <span key={t.id} className="relmap-key">
              <span className="relmap-dot" style={{ background: t.color }} />
              {t.label}
            </span>
          ))}
        </div>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="relmap-body">
        {nodes.length === 0 ? (
          <div className="beat-empty">
            Aún no hay personajes ni relaciones. Abre la biografía de un personaje y añade relaciones.
          </div>
        ) : (
          <svg className="relmap-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            {edges.map((e, i) => {
              const a = posOf(e.from);
              const b = posOf(e.to);
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={relationColor(e.type)}
                  strokeWidth={2}
                  strokeOpacity={0.8}
                />
              );
            })}
            {nodes.map((n) => (
              <g key={n.name} className="relmap-node" onClick={() => onOpenBio(n.name)}>
                <circle cx={n.x} cy={n.y} r={26} />
                <text x={n.x} y={n.y + 44} textAnchor="middle">
                  {n.name.length > 14 ? n.name.slice(0, 13) + "…" : n.name}
                </text>
                <text x={n.x} y={n.y + 5} textAnchor="middle" className="relmap-initial">
                  {n.name.slice(0, 2)}
                </text>
              </g>
            ))}
          </svg>
        )}

        {edges.length > 0 && (
          <div className="relmap-cards">
            <h3 className="relmap-cards-title">Tarjetas de relaciones</h3>
            <div className="relmap-cards-grid">
              {edges.map((e, i) => (
                <div className="relmap-card" key={i} style={{ borderLeftColor: relationColor(e.type) }}>
                  <div className="relmap-card-head">
                    <strong>{e.from}</strong> → <strong>{e.to}</strong>
                    <span className="relmap-card-type" style={{ color: relationColor(e.type) }}>
                      {RELATION_TYPES.find((t) => t.id === e.type)?.label ?? e.type}
                    </span>
                  </div>
                  {e.note && <div className="relmap-card-note">{e.note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
