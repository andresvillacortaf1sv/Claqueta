import { useEffect, useMemo, useState } from "react";
import { Block } from "../lib/serialize";
import { Analysis, heuristicAnalysis, scriptStats, ScriptStats } from "../lib/analysis";
import { loadAIConfig, saveAIConfig, analyzeWithAI, AIConfig } from "../lib/ai";
import { AISettings } from "./AISettings";

interface Props {
  getBlocks: () => Block[];
  onClose: () => void;
}

const CW = 1000;
const CH = 240;

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="an-stat">
      <div className="an-stat-val">{value}</div>
      <div className="an-stat-label">{label}</div>
    </div>
  );
}

export function AnalysisPanel({ getBlocks, onClose }: Props) {
  const [analysis, setAnalysis] = useState<Analysis>(() => heuristicAnalysis(getBlocks()));
  const [stats, setStats] = useState<ScriptStats>(() => scriptStats(getBlocks()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setAnalysis(heuristicAnalysis(getBlocks()));
    setStats(scriptStats(getBlocks()));
  }, [getBlocks]);

  async function analyzeIA(cfg?: AIConfig) {
    const config = cfg ?? loadAIConfig();
    if (!config) {
      setShowSettings(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      setAnalysis(await analyzeWithAI(getBlocks(), config));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo analizar con IA.");
    } finally {
      setBusy(false);
    }
  }

  const n = analysis.scenes.length;
  const px = (i: number) => (n <= 1 ? CW / 2 : (i / (n - 1)) * (CW - 40) + 20);
  const py = (v: number) => CH - 20 - (v / 100) * (CH - 40);
  const line = (key: "intensity" | "attention" | "tension") =>
    analysis.scenes.map((s, i) => `${px(i)},${py(s[key])}`).join(" ");

  const totalScenes = Math.max(1, n);

  const metrics = useMemo(
    () => [
      { key: "intensity" as const, label: "Intensidad", color: "#c8803a" },
      { key: "attention" as const, label: "Atención", color: "#2d6cdf" },
      { key: "tension" as const, label: "Tensión", color: "#b1223b" },
    ],
    [],
  );

  return (
    <div className="beatboard-overlay" role="dialog" aria-label="Análisis del guion">
      <div className="beatboard-bar">
        <span className="beatboard-count">Análisis del guion</span>
        <span className="beatboard-hint">
          {analysis.aiGenerated ? "Generado con IA" : "Estimación por métricas — conecta IA para emociones y resumen"}
        </span>
        <button className="btn-primary" onClick={() => analyzeIA()} disabled={busy}>
          {busy ? "Analizando…" : "Analizar con IA"}
        </button>
        <button className="btn-ghost" onClick={() => setShowSettings(true)}>
          Ajustes IA
        </button>
        <button className="btn-ghost" onClick={onClose}>
          Cerrar
        </button>
      </div>

      <div className="an-body">
        {error && <div className="an-error">{error}</div>}

        <section className="an-card">
          <h3 className="an-title">Panorama del guion</h3>
          <div className="an-stats">
            <Stat label="Escenas" value={stats.scenes} />
            <Stat label="Páginas (aprox.)" value={stats.pages} />
            <Stat label="Palabras" value={stats.words} />
            <Stat label="% diálogo" value={stats.dialoguePct + "%"} />
            <Stat label="INT / EXT" value={`${stats.intCount} / ${stats.extCount}`} />
            <Stat label="Día / Noche" value={`${stats.dayCount} / ${stats.nightCount}`} />
            <Stat label="Líneas/escena" value={stats.avgSceneLines} />
            <Stat label="Diálogo/Acción" value={`${stats.dialogueLines}/${stats.actionLines}`} />
          </div>
          {(stats.longest || stats.shortest) && (
            <p className="an-sub">
              {stats.longest && <>Escena más larga: <b>{stats.longest.heading}</b> ({stats.longest.lines} líneas). </>}
              {stats.shortest && <>Más corta: <b>{stats.shortest.heading}</b> ({stats.shortest.lines}).</>}
            </p>
          )}
        </section>

        {stats.topCharacters.length > 0 && (
          <section className="an-card">
            <h3 className="an-title">Reparto por volumen de diálogo</h3>
            <div className="an-chars">
              {stats.topCharacters.map((c) => {
                const max = stats.topCharacters[0].lines || 1;
                return (
                  <div className="an-char-row" key={c.name}>
                    <span className="an-char-name">{c.name}</span>
                    <div className="an-char-bar">
                      <div className="an-char-fill" style={{ width: `${(c.lines / max) * 100}%` }} />
                    </div>
                    <span className="an-char-val">{c.lines}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="an-card">
          <h3 className="an-title">Resumen del arco dramático</h3>
          <p className={"an-summary" + (analysis.summary ? "" : " is-empty")}>
            {analysis.summary || "El resumen con IA aparecerá aquí. Conéctala con tu propia clave en «Ajustes IA»."}
          </p>
        </section>

        <section className="an-card">
          <h3 className="an-title">Timeline — métricas del guion</h3>
          <div className="an-legend">
            {metrics.map((m) => (
              <span key={m.key} className="an-key">
                <span className="an-swatch" style={{ background: m.color }} />
                {m.label}
              </span>
            ))}
          </div>
          <svg className="an-chart" viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none">
            {[25, 50, 75].map((g) => (
              <line key={g} x1={0} x2={CW} y1={py(g)} y2={py(g)} stroke="#34322e" strokeWidth={1} />
            ))}
            {metrics.map((m) => (
              <polyline key={m.key} points={line(m.key)} fill="none" stroke={m.color} strokeWidth={2} />
            ))}
          </svg>
        </section>

        <section className="an-card">
          <h3 className="an-title">Paleta de emociones a lo largo del guion</h3>
          <div className="an-palette">
            {analysis.scenes.map((s) => (
              <div
                key={s.index}
                className="an-swatch-cell"
                style={{ background: s.color, flex: s.lines || 1 }}
                title={`Escena ${s.index + 1}: ${s.emotion !== "—" ? s.emotion : "intensidad " + s.intensity}`}
              />
            ))}
          </div>
          <p className="an-sub">Emoción (o intensidad) dominante de cada escena como color.</p>
        </section>

        <section className="an-card">
          <h3 className="an-title">Mapa estructural narrativo</h3>
          <div className="an-struct">
            {analysis.structure.map((p) => {
              const w = ((p.to - p.from + 1) / totalScenes) * 100;
              return (
                <div key={p.etapa} className="an-struct-part" style={{ width: `${w}%`, background: p.color }}>
                  {p.etapa}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {showSettings && (
        <AISettings
          initial={loadAIConfig()}
          onSave={(cfg) => {
            saveAIConfig(cfg);
            analyzeIA(cfg);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
