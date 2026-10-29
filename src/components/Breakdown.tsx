import { useState } from "react";
import { SceneBreakdown, sceneKey } from "../lib/breakdown";
import { CharacterStat } from "../lib/characters";
import { LocationStat } from "../lib/locations";
import { BreakdownData, CATEGORIES, Category } from "../lib/breakdownStore";

interface Props {
  scenes: SceneBreakdown[];
  characters: CharacterStat[];
  locations: LocationStat[];
  data: BreakdownData;
  onSetField: (key: string, cat: Category, value: string) => void;
  onJump: (pos: number) => void;
  onExport: (filename: string, csv: string) => void;
  onClose: () => void;
}

type View = "escena" | "personajes" | "lugares";

function cell(s: string): string {
  return `"${(s ?? "").replace(/"/g, '""')}"`;
}
function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

export function Breakdown(props: Props) {
  const [view, setView] = useState<View>("escena");
  const { scenes, characters, locations, data } = props;

  function exportEscenas() {
    const header = ["#", "INT/EXT", "LUGAR", "TIEMPO", "REPARTO", ...CATEGORIES.map((c) => c.label)];
    const rows = scenes.map((s) => {
      const el = data[sceneKey(s.heading)] ?? {};
      return [
        String(s.index + 1),
        s.ie,
        s.place,
        s.time,
        s.cast.join("; "),
        ...CATEGORIES.map((c) => el[c.id] ?? ""),
      ];
    });
    props.onExport("desglose-escenas.csv", toCsv([header, ...rows]));
  }
  function exportPersonajes() {
    const header = ["PERSONAJE", "PARLAMENTOS", "ESCENAS", "PALABRAS"];
    const rows = characters.map((c) => [c.name, String(c.dialogues), String(c.scenes), String(c.words)]);
    props.onExport("desglose-personajes.csv", toCsv([header, ...rows]));
  }
  function exportLugares() {
    const header = ["LUGAR", "ESCENAS", "INTERIORES", "EXTERIORES", "MOMENTOS"];
    const rows = locations.map((l) => [l.place, String(l.scenes), String(l.interiors), String(l.exteriors), l.times.join("; ")]);
    props.onExport("desglose-lugares.csv", toCsv([header, ...rows]));
  }

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Desglose de guion">
      <div className="beatboard-bar">
        <span className="beatboard-count">Desglose de guion</span>
        <div className="bd-tabs">
          <button className={view === "escena" ? "is-on" : ""} onClick={() => setView("escena")}>
            Por escena
          </button>
          <button className={view === "personajes" ? "is-on" : ""} onClick={() => setView("personajes")}>
            Personajes
          </button>
          <button className={view === "lugares" ? "is-on" : ""} onClick={() => setView("lugares")}>
            Lugares
          </button>
        </div>
        <button
          className="btn-ghost"
          onClick={view === "escena" ? exportEscenas : view === "personajes" ? exportPersonajes : exportLugares}
        >
          Exportar CSV
        </button>
        <button className="btn-ghost" onClick={props.onClose}>
          Cerrar
        </button>
      </div>

      <div className="bd-body">
        {view === "escena" && (
          <div className="bd-scenes">
            {scenes.map((s) => {
              const key = sceneKey(s.heading);
              const el = data[key] ?? {};
              return (
                <div className="bd-sheet" key={s.pos}>
                  <div className="bd-sheet-head">
                    <span className="bd-num">{s.index + 1}</span>
                    <button className="bd-heading" onClick={() => { props.onJump(s.pos); props.onClose(); }}>
                      {s.heading}
                    </button>
                  </div>
                  <div className="bd-cast">
                    <span className="bd-cat-label">Reparto</span>
                    <div className="bd-chips">
                      {s.cast.length ? s.cast.map((c) => <span className="bd-chip" key={c}>{c}</span>) : <span className="bd-none">—</span>}
                    </div>
                  </div>
                  {CATEGORIES.map((cat) => (
                    <label className="bd-field" key={cat.id}>
                      <span className="bd-cat-label">{cat.label}</span>
                      <input
                        defaultValue={el[cat.id] ?? ""}
                        placeholder="separa con comas…"
                        onBlur={(e) => props.onSetField(key, cat.id, e.target.value)}
                      />
                    </label>
                  ))}
                </div>
              );
            })}
            {scenes.length === 0 && <div className="beat-empty">Crea encabezados de escena (INT./EXT.) para desglosar.</div>}
          </div>
        )}

        {view === "personajes" && (
          <table className="bd-table">
            <thead>
              <tr><th>Personaje</th><th>Parlamentos</th><th>Escenas</th><th>Palabras</th></tr>
            </thead>
            <tbody>
              {characters.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td><td>{c.dialogues}</td><td>{c.scenes}</td><td>{c.words}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === "lugares" && (
          <table className="bd-table">
            <thead>
              <tr><th>Lugar</th><th>Escenas</th><th>Int.</th><th>Ext.</th><th>Momentos</th></tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.place}>
                  <td>{l.place}</td><td>{l.scenes}</td><td>{l.interiors}</td><td>{l.exteriors}</td><td>{l.times.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {view === "escena" && scenes.length > 0 && (
          <p className="bd-tip">Los elementos que escribas aquí (utilería, vestuario, etc.) se guardan en tu dispositivo y se incluyen en el CSV.</p>
        )}
      </div>
    </div>
  );
}
