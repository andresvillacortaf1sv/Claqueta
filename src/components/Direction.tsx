import { useEffect, useRef, useState } from "react";
import { SceneBreakdown } from "../lib/breakdown";
import {
  DirectionData,
  DirectionScene,
  DEPARTMENTS,
  DeptId,
  STATUS_OPTIONS,
  SHOT_TYPES,
  ANGLES,
  MOVES,
  Shot,
  loadDirection,
  saveDirection,
  getScene,
  emptyShot,
} from "../lib/direction";
import { fileToResizedDataURL } from "../lib/imageResize";

interface Props {
  scenes: SceneBreakdown[];
  onJump: (pos: number) => void;
  onClose: () => void;
}

type Tab = "desglose" | "storyboard" | "planos";

export function Direction({ scenes, onJump, onClose }: Props) {
  const [data, setData] = useState<DirectionData>(() => loadDirection());
  const [tab, setTab] = useState<Tab>("desglose");
  const [sel, setSel] = useState(0);
  const storyInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => saveDirection(data), 400);
    return () => clearTimeout(t);
  }, [data]);

  if (scenes.length === 0) {
    return (
      <div className="beatboard-overlay" role="dialog" aria-label="Dirección">
        <div className="beatboard-bar">
          <span className="beatboard-count">Dirección</span>
          <button className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="beat-empty">Crea encabezados de escena (INT./EXT.) para trabajar la dirección.</div>
      </div>
    );
  }

  const scene = scenes[Math.min(sel, scenes.length - 1)];
  const key = scene.heading.toUpperCase().trim();
  const ds: DirectionScene = getScene(data, key);

  const updateScene = (patch: Partial<DirectionScene>) =>
    setData((d) => ({ ...d, [key]: { ...getScene(d, key), ...patch } }));

  const setNote = (dept: DeptId, v: string) =>
    updateScene({ notes: { ...ds.notes, [dept]: v } });
  const setStatus = (dept: DeptId, v: string) =>
    updateScene({ status: { ...ds.status, [dept]: v } });

  async function onStory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      updateScene({ storyboard: await fileToResizedDataURL(file, 900) });
    } catch {
      /* imagen inválida */
    }
  }

  const addShot = () => updateScene({ shots: [...ds.shots, emptyShot(ds.shots.length + 1)] });
  const updateShot = (id: string, patch: Partial<Shot>) =>
    updateScene({ shots: ds.shots.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeShot = (id: string) => updateScene({ shots: ds.shots.filter((s) => s.id !== id) });

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Dirección">
      <div className="beatboard-bar">
        <span className="beatboard-count">Dirección</span>
        <div className="bd-tabs">
          <button className={tab === "desglose" ? "is-on" : ""} onClick={() => setTab("desglose")}>
            Desglose técnico
          </button>
          <button className={tab === "storyboard" ? "is-on" : ""} onClick={() => setTab("storyboard")}>
            Storyboard
          </button>
          <button className={tab === "planos" ? "is-on" : ""} onClick={() => setTab("planos")}>
            Lista de planos
          </button>
        </div>
        <button className="btn-ghost" onClick={() => { onJump(scene.pos); onClose(); }}>
          Ir a la escena
        </button>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="dir-body">
        {/* Lista de escenas */}
        <aside className="dir-scenes">
          {scenes.map((s, i) => {
            const k = s.heading.toUpperCase().trim();
            const sc = data[k];
            const notes = sc ? Object.values(sc.notes).filter(Boolean).length : 0;
            const shots = sc ? sc.shots.length : 0;
            return (
              <button
                key={s.pos}
                className={"dir-scene" + (i === sel ? " is-sel" : "")}
                onClick={() => setSel(i)}
              >
                <span className="dir-scene-num">{i}</span>
                <span className="dir-scene-head">{s.heading}</span>
                <span className="dir-scene-badge">{tab === "planos" ? shots : notes}</span>
              </button>
            );
          })}
        </aside>

        <div className="dir-main">
          {tab === "desglose" && (
            <div className="dir-depts">
              <h3 className="dir-title">{scene.heading}</h3>
              {DEPARTMENTS.map((dep) => (
                <div className="dir-dept" key={dep.id}>
                  <div className="dir-dept-head">
                    <span className="dir-dept-name">{dep.label}</span>
                    <select
                      className="dir-status"
                      value={ds.status[dep.id] ?? "Sin empezar"}
                      onChange={(e) => setStatus(dep.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    className="dir-note"
                    value={ds.notes[dep.id] ?? ""}
                    placeholder={`Notas de ${dep.label.toLowerCase()}…`}
                    onChange={(e) => setNote(dep.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          {tab === "storyboard" && (
            <div className="dir-story">
              <h3 className="dir-title">{scene.heading}</h3>
              <div className="dir-story-frame" onClick={() => storyInput.current?.click()}>
                {ds.storyboard ? (
                  <img src={ds.storyboard} alt="storyboard" />
                ) : (
                  <span className="dir-story-empty">＋ Subir imagen del storyboard</span>
                )}
                <input ref={storyInput} type="file" accept="image/*" hidden onChange={onStory} />
              </div>
              {ds.storyboard && (
                <button className="btn-ghost" onClick={() => updateScene({ storyboard: "" })}>
                  Quitar imagen
                </button>
              )}
              <textarea
                className="dir-note"
                value={ds.storyNote}
                placeholder="Descripción del cuadro / acción / notas de cámara…"
                onChange={(e) => updateScene({ storyNote: e.target.value })}
              />
            </div>
          )}

          {tab === "planos" && (
            <div className="dir-shots">
              <div className="dir-shots-head">
                <h3 className="dir-title">{scene.heading}</h3>
                <button className="rb-btn rb-btn-primary" onClick={addShot}>
                  + Añadir plano
                </button>
              </div>
              {ds.shots.length === 0 && <div className="beat-empty">Sin planos. Añade el primero.</div>}
              {ds.shots.map((s) => (
                <div className="dir-shot" key={s.id}>
                  <div className="dir-shot-grid">
                    <label>Plano<input value={s.number} onChange={(e) => updateShot(s.id, { number: e.target.value })} /></label>
                    <label>Tipo
                      <select value={s.type} onChange={(e) => updateShot(s.id, { type: e.target.value })}>
                        {SHOT_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </label>
                    <label>Cámara<input value={s.camera} onChange={(e) => updateShot(s.id, { camera: e.target.value })} placeholder="A / B" /></label>
                    <label>Lente<input value={s.lens} onChange={(e) => updateShot(s.id, { lens: e.target.value })} /></label>
                    <label>Ángulo
                      <select value={s.angle} onChange={(e) => updateShot(s.id, { angle: e.target.value })}>
                        <option value="">—</option>
                        {ANGLES.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </label>
                    <label>Movimiento
                      <select value={s.move} onChange={(e) => updateShot(s.id, { move: e.target.value })}>
                        <option value="">—</option>
                        {MOVES.map((m) => <option key={m}>{m}</option>)}
                      </select>
                    </label>
                    <label>Duración (s)<input value={s.duration} onChange={(e) => updateShot(s.id, { duration: e.target.value })} /></label>
                    <label className="dir-shot-wide">Sujeto / encuadre<input value={s.subject} onChange={(e) => updateShot(s.id, { subject: e.target.value })} /></label>
                  </div>
                  <textarea
                    className="dir-note"
                    value={s.description}
                    placeholder="Descripción del plano / acción / notas de cámara…"
                    onChange={(e) => updateShot(s.id, { description: e.target.value })}
                  />
                  <div className="dir-shot-foot">
                    <label className="dir-shot-done">
                      <input type="checkbox" checked={s.shot} onChange={(e) => updateShot(s.id, { shot: e.target.checked })} />
                      Filmado
                    </label>
                    <button className="dir-shot-del" onClick={() => removeShot(s.id)}>
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
