import { useEffect, useRef, useState, useCallback } from "react";
import {
  Board,
  BoardCard,
  CardKind,
  CARD_KINDS,
  loadBoards,
  saveBoards,
  defaultBoard,
  newId,
} from "../lib/board";
import { fileToResizedDataURL } from "../lib/imageResize";

interface Props {
  onClose: () => void;
}

type Mode = "libre" | "timeline";

export function ConceptBoard({ onClose }: Props) {
  const [boards, setBoards] = useState<Board[]>(() => loadBoards());
  const [activeId, setActiveId] = useState<string>(() => loadBoards()[0].id);
  const [mode, setMode] = useState<Mode>("libre");
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const board = boards.find((b) => b.id === activeId) ?? boards[0];

  useEffect(() => {
    const t = setTimeout(() => saveBoards(boards), 400);
    return () => clearTimeout(t);
  }, [boards]);

  const update = useCallback(
    (fn: (b: Board) => Board) => setBoards((bs) => bs.map((b) => (b.id === activeId ? fn(b) : b))),
    [activeId],
  );

  const addCard = (kind: CardKind) => {
    if (kind === "imagen") {
      imgInput.current?.click();
      return;
    }
    const color = CARD_KINDS.find((k) => k.id === kind)!.color;
    const card: BoardCard = {
      id: newId("c"),
      kind,
      text: "",
      x: 60 + Math.random() * 120,
      y: 60 + Math.random() * 120,
      color,
      date: kind === "hito" ? "" : undefined,
    };
    update((b) => ({ ...b, cards: [...b.cards, card] }));
  };

  async function onAddImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const image = await fileToResizedDataURL(file, 600);
      const card: BoardCard = {
        id: newId("c"),
        kind: "imagen",
        text: "",
        x: 60 + Math.random() * 120,
        y: 60 + Math.random() * 120,
        color: "#8a63d2",
        image,
      };
      update((b) => ({ ...b, cards: [...b.cards, card] }));
    } catch {
      /* imagen inválida */
    }
  }

  const editCard = (id: string, patch: Partial<BoardCard>) =>
    update((b) => ({ ...b, cards: b.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));

  const removeCard = (id: string) =>
    update((b) => ({
      ...b,
      cards: b.cards.filter((c) => c.id !== id),
      edges: b.edges.filter((e) => e.from !== id && e.to !== id),
    }));

  const onCardDown = (card: BoardCard) => (e: React.PointerEvent) => {
    if (mode === "timeline") return;
    if ((e.target as HTMLElement).tagName === "TEXTAREA" || (e.target as HTMLElement).tagName === "INPUT") return;
    const rect = surfaceRef.current!.getBoundingClientRect();
    drag.current = { id: card.id, dx: e.clientX - rect.left - card.x, dy: e.clientY - rect.top - card.y };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const rect = surfaceRef.current!.getBoundingClientRect();
    editCard(drag.current.id, {
      x: Math.max(0, e.clientX - rect.left - drag.current.dx),
      y: Math.max(0, e.clientY - rect.top - drag.current.dy),
    });
  };
  const onUp = () => {
    drag.current = null;
  };

  const clickConnect = (id: string) => {
    if (connectFrom === null) {
      setConnectFrom(id);
    } else if (connectFrom === id) {
      setConnectFrom(null);
    } else {
      const from = connectFrom;
      update((b) => ({ ...b, edges: [...b.edges, { id: newId("e"), from, to: id }] }));
      setConnectFrom(null);
    }
  };

  const addBoard = () => {
    const b = { ...defaultBoard(), name: `Pizarra ${boards.length + 1}` };
    setBoards((bs) => [...bs, b]);
    setActiveId(b.id);
  };

  // Para timeline: ordenar hitos por fecha/orden
  const hitos = [...board.cards.filter((c) => c.kind === "hito")].sort((a, b) =>
    (a.date || "").localeCompare(b.date || ""),
  );

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Pizarra conceptual">
      <div className="beatboard-bar">
        <span className="beatboard-count">Pizarra conceptual</span>
        <select className="cb-boardsel" value={activeId} onChange={(e) => setActiveId(e.target.value)}>
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button className="btn-ghost" onClick={addBoard}>
          + Pizarra
        </button>
        <div className="cb-modes">
          <button className={mode === "libre" ? "is-on" : ""} onClick={() => setMode("libre")}>
            Mapa libre
          </button>
          <button className={mode === "timeline" ? "is-on" : ""} onClick={() => setMode("timeline")}>
            Línea de tiempo
          </button>
        </div>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <input ref={imgInput} type="file" accept="image/*" hidden onChange={onAddImage} />

      {mode === "libre" ? (
        <>
          <div className="cb-toolbar">
            {CARD_KINDS.map((k) => (
              <button key={k.id} className="rb-btn" onClick={() => addCard(k.id)}>
                <span className="cb-dot" style={{ background: k.color }} /> + {k.label}
              </button>
            ))}
            <span className="cb-hint">
              {connectFrom ? "Elige la tarjeta destino…" : "Usa «Conectar» en una tarjeta para enlazar dos."}
            </span>
          </div>
          <div className="cb-surface" ref={surfaceRef} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
            <svg className="cb-edges">
              {board.edges.map((e) => {
                const a = board.cards.find((c) => c.id === e.from);
                const b = board.cards.find((c) => c.id === e.to);
                if (!a || !b) return null;
                return (
                  <line key={e.id} x1={a.x + 90} y1={a.y + 35} x2={b.x + 90} y2={b.y + 35} stroke="#6f6960" strokeWidth={2} />
                );
              })}
            </svg>
            {board.cards.map((c) => (
              <div
                key={c.id}
                className={"cb-card" + (connectFrom === c.id ? " is-connecting" : "")}
                style={{ left: c.x, top: c.y, borderTopColor: c.color }}
                onPointerDown={onCardDown(c)}
              >
                <div className="cb-card-head">
                  <span className="cb-kind" style={{ color: c.color }}>
                    {CARD_KINDS.find((k) => k.id === c.kind)?.label}
                  </span>
                  <div className="cb-card-actions">
                    <button onClick={() => clickConnect(c.id)} title="Conectar">
                      ⤭
                    </button>
                    <button onClick={() => removeCard(c.id)} title="Borrar">
                      ×
                    </button>
                  </div>
                </div>
                {c.kind === "hito" && (
                  <input
                    className="cb-date"
                    value={c.date ?? ""}
                    placeholder="fecha / orden"
                    onChange={(e) => editCard(c.id, { date: e.target.value })}
                  />
                )}
                {c.kind === "imagen" && c.image && (
                  <img className="cb-img" src={c.image} alt="" draggable={false} />
                )}
                <textarea
                  className="cb-text"
                  value={c.text}
                  placeholder={c.kind === "imagen" ? "Pie de imagen…" : "Escribe…"}
                  onChange={(e) => editCard(c.id, { text: e.target.value })}
                />
              </div>
            ))}
            {board.cards.length === 0 && (
              <div className="cb-empty">Añade ideas, notas o hitos con los botones de arriba. Arrástralos para organizarlos.</div>
            )}
          </div>
        </>
      ) : (
        <div className="cb-timeline">
          {hitos.length === 0 ? (
            <div className="cb-empty">Añade tarjetas de tipo «Hito» (en Mapa libre) y aquí aparecerán ordenadas como línea de tiempo.</div>
          ) : (
            <div className="cb-tl-track">
              {hitos.map((h, i) => (
                <div className="cb-tl-item" key={h.id}>
                  <div className="cb-tl-dot" style={{ background: h.color }} />
                  <div className="cb-tl-date">{h.date || `#${i + 1}`}</div>
                  <div className="cb-tl-card">{h.text || "(sin texto)"}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
