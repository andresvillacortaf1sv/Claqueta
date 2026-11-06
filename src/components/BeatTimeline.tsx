import { useEffect, useRef, useState } from "react";
import {
  Timeline,
  TimelineItem,
  LaneId,
  LANES,
  laneColor,
  loadTimeline,
  saveTimeline,
  newItemId,
  fmtTime,
} from "../lib/beattimeline";

interface Props {
  onClose: () => void;
}

const LANE_H = 60;
const RULER_H = 28;

export function BeatTimeline({ onClose }: Props) {
  const [tl, setTl] = useState<Timeline>(() => loadTimeline());
  const [pxPerSec, setPxPerSec] = useState(0.18); // zoom
  const [selected, setSelected] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; startX: number; origStart: number } | null>(null);

  useEffect(() => {
    const t = setTimeout(() => saveTimeline(tl), 300);
    return () => clearTimeout(t);
  }, [tl]);

  const width = tl.totalSeconds * pxPerSec;

  const addItem = (lane: LaneId) => {
    // Colocar en el centro visible del scroll.
    const scroll = scrollRef.current;
    const centerPx = scroll ? scroll.scrollLeft + scroll.clientWidth / 2 : 0;
    const start = Math.max(0, Math.round(centerPx / pxPerSec));
    const item: TimelineItem = {
      id: newItemId(),
      lane,
      start,
      duration: lane === "acto" ? 1200 : lane === "escena" ? 180 : 60,
      label: "",
    };
    setTl((t) => ({ ...t, items: [...t.items, item] }));
    setSelected(item.id);
  };

  const updateItem = (id: string, patch: Partial<TimelineItem>) =>
    setTl((t) => ({ ...t, items: t.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) }));

  const removeItem = (id: string) => {
    setTl((t) => ({ ...t, items: t.items.filter((it) => it.id !== id) }));
    setSelected(null);
  };

  const onItemDown = (it: TimelineItem) => (e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setSelected(it.id);
    drag.current = { id: it.id, startX: e.clientX, origStart: it.start };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.startX) / pxPerSec;
    const start = Math.max(0, Math.round((drag.current.origStart + dx) / 5) * 5);
    updateItem(drag.current.id, { start });
  };
  const onUp = () => {
    drag.current = null;
  };

  // Marcas del ruler cada 5 minutos.
  const ticks: number[] = [];
  for (let s = 0; s <= tl.totalSeconds; s += 300) ticks.push(s);

  const sel = tl.items.find((i) => i.id === selected) ?? null;

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Beat Timeline">
      <div className="beatboard-bar">
        <span className="beatboard-count">Beat Timeline</span>
        <div className="bt-add">
          {LANES.map((l) => (
            <button key={l.id} className="bt-add-btn" style={{ borderColor: l.color, color: l.color }} onClick={() => addItem(l.id)}>
              + {l.label.split(" ")[0]}
            </button>
          ))}
        </div>
        <div className="bt-zoom">
          <button onClick={() => setPxPerSec((z) => Math.max(0.03, z / 1.4))}>−</button>
          <button onClick={() => setPxPerSec((z) => Math.min(2, z * 1.4))}>+</button>
          <button
            onClick={() => {
              const w = scrollRef.current?.clientWidth ?? 800;
              setPxPerSec(Math.max(0.03, (w - 20) / tl.totalSeconds));
            }}
          >
            Fit
          </button>
        </div>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="bt-body">
        <div className="bt-lanes-col">
          <div className="bt-corner" style={{ height: RULER_H }} />
          {LANES.map((l) => (
            <div key={l.id} className="bt-lane-label" style={{ height: LANE_H }}>
              <span className="bt-lane-dot" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>

        <div className="bt-scroll" ref={scrollRef}>
          <div style={{ width, position: "relative" }}>
            <div className="bt-ruler" style={{ width, height: RULER_H }}>
              {ticks.map((s) => (
                <div key={s} className="bt-tick" style={{ left: s * pxPerSec }}>
                  <span>{fmtTime(s)}</span>
                </div>
              ))}
            </div>

            <div
              className="bt-lanes"
              style={{ width }}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              onPointerDown={() => setSelected(null)}
            >
              {LANES.map((l) => (
                <div key={l.id} className="bt-lane" style={{ height: LANE_H }}>
                  {tl.items
                    .filter((it) => it.lane === l.id)
                    .map((it) => (
                      <div
                        key={it.id}
                        className={"bt-item" + (selected === it.id ? " is-sel" : "")}
                        style={{
                          left: it.start * pxPerSec,
                          width: Math.max(10, it.duration * pxPerSec),
                          background: it.color ?? laneColor(l.id),
                        }}
                        onPointerDown={onItemDown(it)}
                        title={`${it.label || l.label} · ${fmtTime(it.start)}`}
                      >
                        <span className="bt-item-label">{it.label || l.label}</span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {sel && (
        <div className="bt-inspector">
          <input
            className="bt-insp-label"
            value={sel.label}
            placeholder={"Nombre del " + LANES.find((l) => l.id === sel.lane)?.label.toLowerCase()}
            onChange={(e) => updateItem(sel.id, { label: e.target.value })}
          />
          <label>
            Inicio
            <input
              type="number"
              value={Math.round(sel.start)}
              onChange={(e) => updateItem(sel.id, { start: Math.max(0, Number(e.target.value)) })}
            />
            s
          </label>
          <label>
            Duración
            <input
              type="number"
              value={Math.round(sel.duration)}
              onChange={(e) => updateItem(sel.id, { duration: Math.max(5, Number(e.target.value)) })}
            />
            s
          </label>
          <span className="bt-insp-time">{fmtTime(sel.start)} → {fmtTime(sel.start + sel.duration)}</span>
          <button className="bt-insp-del" onClick={() => removeItem(sel.id)}>
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
