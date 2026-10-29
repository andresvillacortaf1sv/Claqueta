import { useEffect, useState } from "react";
import { SceneBreakdown } from "../lib/breakdown";
import {
  Schedule,
  ShootDay,
  Strip,
  StripKind,
  loadSchedule,
  saveSchedule,
  newId,
  unassignedScenes,
} from "../lib/schedule";

interface Props {
  scenes: SceneBreakdown[];
  onClose?: () => void;
  embedded?: boolean;
}

const STRIP_META: Record<StripKind, { label: string; color: string }> = {
  scene: { label: "Escena", color: "#3a506b" },
  meal: { label: "Comida / Descanso", color: "#2e5a44" },
  move: { label: "Company Move", color: "#8a5a1a" },
  note: { label: "Nota", color: "#5a3a6b" },
};

export function ShootSchedule({ scenes, onClose, embedded }: Props) {
  const [sched, setSched] = useState<Schedule>(() => loadSchedule());
  const [dragScene, setDragScene] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => saveSchedule(sched), 400);
    return () => clearTimeout(t);
  }, [sched]);

  const unassigned = unassignedScenes(scenes.length, sched);

  const addDay = () =>
    setSched((s) => ({
      days: [...s.days, { id: newId("d"), date: new Date().toISOString().slice(0, 10), strips: [] }],
    }));

  const updateDay = (id: string, fn: (d: ShootDay) => ShootDay) =>
    setSched((s) => ({ days: s.days.map((d) => (d.id === id ? fn(d) : d)) }));

  const removeDay = (id: string) => setSched((s) => ({ days: s.days.filter((d) => d.id !== id) }));

  const addStrip = (dayId: string, kind: StripKind) =>
    updateDay(dayId, (d) => ({ ...d, strips: [...d.strips, { id: newId("s"), kind, text: "" }] }));

  const dropSceneOn = (dayId: string) => {
    if (dragScene === null) return;
    const idx = dragScene;
    setSched((s) => ({
      days: s.days.map((d) => {
        const strips = d.strips.filter((st) => !(st.kind === "scene" && st.sceneIndex === idx));
        if (d.id === dayId) strips.push({ id: newId("s"), kind: "scene", sceneIndex: idx });
        return { ...d, strips };
      }),
    }));
    setDragScene(null);
  };

  const removeStrip = (dayId: string, stripId: string) =>
    updateDay(dayId, (d) => ({ ...d, strips: d.strips.filter((s) => s.id !== stripId) }));

  const setStripText = (dayId: string, stripId: string, text: string) =>
    updateDay(dayId, (d) => ({ ...d, strips: d.strips.map((s) => (s.id === stripId ? { ...s, text } : s)) }));

  const sceneLabel = (i: number) => {
    const s = scenes[i];
    return s ? `${i}. ${s.heading}` : `Escena ${i}`;
  };

  const content = (
    <>
      {embedded && (
        <div className="sch-embed-bar">
          <button className="btn-primary" onClick={addDay}>
            + Día
          </button>
          <span className="beatboard-hint">Arrastra las escenas sin asignar a un día</span>
        </div>
      )}
      <div className="sch-body">
        <aside className="sch-unassigned">
          <div className="sch-un-head">Sin asignar · {unassigned.length}</div>
          {unassigned.map((i) => (
            <div
              key={i}
              className="sch-scene-card"
              draggable
              onDragStart={() => setDragScene(i)}
              onDragEnd={() => setDragScene(null)}
            >
              <span className="sch-scene-num">{i}</span>
              <span className="sch-scene-head">{scenes[i].heading}</span>
            </div>
          ))}
          {unassigned.length === 0 && scenes.length > 0 && (
            <div className="sch-un-empty">Todas las escenas están asignadas.</div>
          )}
          {scenes.length === 0 && <div className="sch-un-empty">Crea escenas en el guion.</div>}
        </aside>

        <div className="sch-days">
          {sched.days.map((day, di) => (
            <div
              key={day.id}
              className="sch-day"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropSceneOn(day.id)}
            >
              <div className="sch-day-head">
                <strong>Día {di + 1}</strong>
                <input
                  type="date"
                  value={day.date}
                  onChange={(e) => updateDay(day.id, (d) => ({ ...d, date: e.target.value }))}
                />
                <button className="sch-day-x" onClick={() => removeDay(day.id)} title="Quitar día">
                  ×
                </button>
              </div>

              <div className="sch-day-tools">
                <button onClick={() => addStrip(day.id, "meal")}>+ Comida</button>
                <button onClick={() => addStrip(day.id, "move")}>+ Move</button>
                <button onClick={() => addStrip(day.id, "note")}>+ Nota</button>
              </div>

              <div className="sch-strips">
                {day.strips.map((s) => (
                  <Stripe
                    key={s.id}
                    strip={s}
                    sceneLabel={sceneLabel}
                    onText={(t) => setStripText(day.id, s.id, t)}
                    onRemove={() => removeStrip(day.id, s.id)}
                  />
                ))}
                {day.strips.length === 0 && <div className="sch-day-empty">Arrastra escenas aquí.</div>}
              </div>
            </div>
          ))}
          {sched.days.length === 0 && (
            <div className="sch-day-empty sch-no-days">Pulsa «+ Día» para empezar el plan de rodaje.</div>
          )}
        </div>
      </div>
    </>
  );

  if (embedded) return <div className="sch-embed">{content}</div>;

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Plan de rodaje">
      <div className="beatboard-bar">
        <span className="beatboard-count">Plan de rodaje</span>
        <button className="btn-primary" onClick={addDay}>
          + Día
        </button>
        <span className="beatboard-hint">Arrastra las escenas sin asignar a un día</span>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>
      {content}
    </div>
  );
}

function Stripe({
  strip,
  sceneLabel,
  onText,
  onRemove,
}: {
  strip: Strip;
  sceneLabel: (i: number) => string;
  onText: (t: string) => void;
  onRemove: () => void;
}) {
  const meta = STRIP_META[strip.kind];
  return (
    <div className="sch-strip" style={{ borderLeftColor: meta.color }}>
      <div className="sch-strip-head">
        <span className="sch-strip-kind" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <button className="sch-strip-x" onClick={onRemove}>
          ×
        </button>
      </div>
      {strip.kind === "scene" ? (
        <div className="sch-strip-scene">{sceneLabel(strip.sceneIndex!)}</div>
      ) : (
        <input
          className="sch-strip-input"
          value={strip.text ?? ""}
          placeholder={meta.label + "…"}
          onChange={(e) => onText(e.target.value)}
        />
      )}
    </div>
  );
}
