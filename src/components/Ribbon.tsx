import { useState, ReactNode } from "react";
import { ElementType, ELEMENT_LABELS, TAB_CYCLE } from "../editor/elements";
import { REVISIONS } from "../lib/revisions";
import { Menu } from "./Menu";

export type MarkName = "strong" | "em" | "underline" | "strikethrough";
export interface ActiveMarks {
  strong: boolean;
  em: boolean;
  underline: boolean;
  strikethrough: boolean;
}

interface Props {
  current: ElementType;
  onPickElement: (type: ElementType) => void;
  activeMarks: ActiveMarks;
  onToggleMark: (name: MarkName) => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPortada: () => void;
  onPreview: () => void;
  onImportFdx: () => void;
  onImportFountain: () => void;
  onExportFdx: () => void;
  onExportFountain: () => void;
  revEnabled: boolean;
  revId: string;
  onPickRevision: (id: string) => void;
  onDisableRevision: () => void;
  onClearRevisions: () => void;
  navOpen: boolean;
  onToggleNav: () => void;
  onBeatBoard: () => void;
  onCharacters: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  night: boolean;
  onToggleNight: () => void;
  spell: boolean;
  onToggleSpell: () => void;
  onFindReplace: () => void;
  onVersions: () => void;
  onBreakdown: () => void;
  onNeural: () => void;
  onAnalysis: () => void;
  onConceptBoard: () => void;
  onDirection: () => void;
  onDevelopment: () => void;
  onAddNote: () => void;
  onDialogueExt: (ext: string) => void;
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rb-group">
      <div className="rb-group-body">{children}</div>
      <div className="rb-group-label">{label}</div>
    </div>
  );
}

export function Ribbon(props: Props) {
  const [tab, setTab] = useState<"inicio" | "edicion" | "herramientas">("inicio");
  const m = props.activeMarks;

  return (
    <div className="ribbon">
      <div className="ribbon-tabbar">
        <div className="ribbon-brand">
          <span className="toolbar-logo">◉</span>
          <span className="toolbar-title">Claqueta</span>
        </div>
        <div className="ribbon-tabs">
          <button
            className={"rb-tab" + (tab === "inicio" ? " is-active" : "")}
            onClick={() => setTab("inicio")}
          >
            Inicio
          </button>
          <button
            className={"rb-tab" + (tab === "edicion" ? " is-active" : "")}
            onClick={() => setTab("edicion")}
          >
            Edición
          </button>
          <button
            className={"rb-tab" + (tab === "herramientas" ? " is-active" : "")}
            onClick={() => setTab("herramientas")}
          >
            Herramientas
          </button>
        </div>
      </div>

      <div className="ribbon-panel">
        {tab === "inicio" && (
          <>
            <Group label="Portapapeles">
              <button className="rb-btn" onClick={props.onPaste} title="Pegar">
                Pegar
              </button>
              <button className="rb-btn" onClick={props.onCut} title="Cortar">
                Cortar
              </button>
              <button className="rb-btn" onClick={props.onCopy} title="Copiar">
                Copiar
              </button>
            </Group>

            <Group label="Historial">
              <button className="rb-btn" onClick={props.onUndo} disabled={!props.canUndo} title="Deshacer (Ctrl/Cmd+Z)">
                ↶ Deshacer
              </button>
              <button className="rb-btn" onClick={props.onRedo} disabled={!props.canRedo} title="Rehacer (Ctrl/Cmd+Y)">
                ↷ Rehacer
              </button>
            </Group>

            <Group label="Elemento">
              <select
                className="rb-select"
                value={props.current}
                onChange={(e) => props.onPickElement(e.target.value as ElementType)}
              >
                {TAB_CYCLE.map((t) => (
                  <option key={t} value={t}>
                    {ELEMENT_LABELS[t]}
                  </option>
                ))}
              </select>
            </Group>

            <Group label="Fuente">
              <button
                className={"rb-tgl" + (m.strong ? " is-on" : "")}
                onClick={() => props.onToggleMark("strong")}
                title="Negrita (Ctrl/Cmd+B)"
              >
                <b>N</b>
              </button>
              <button
                className={"rb-tgl" + (m.em ? " is-on" : "")}
                onClick={() => props.onToggleMark("em")}
                title="Cursiva (Ctrl/Cmd+I)"
              >
                <i>K</i>
              </button>
              <button
                className={"rb-tgl" + (m.underline ? " is-on" : "")}
                onClick={() => props.onToggleMark("underline")}
                title="Subrayado (Ctrl/Cmd+U)"
              >
                <u>S</u>
              </button>
              <button
                className={"rb-tgl" + (m.strikethrough ? " is-on" : "")}
                onClick={() => props.onToggleMark("strikethrough")}
                title="Tachado (Ctrl/Cmd+Shift+S)"
              >
                <s>T</s>
              </button>
            </Group>

            <Group label="Diálogo">
              <button className="rb-btn" onClick={() => props.onDialogueExt("V.O.")} title="Añadir (V.O.) al personaje">
                (V.O.)
              </button>
              <button className="rb-btn" onClick={() => props.onDialogueExt("O.S.")} title="Añadir (O.S.) al personaje">
                (O.S.)
              </button>
              <button className="rb-btn" onClick={() => props.onDialogueExt("CONT'D")} title="Añadir (CONT'D) al personaje">
                (CONT'D)
              </button>
            </Group>

            <Group label="Vista">
              <button
                className={"rb-btn" + (props.night ? " is-on" : "")}
                onClick={props.onToggleNight}
                title="Modo noche"
              >
                {props.night ? "☀ Día" : "☾ Noche"}
              </button>
              <button
                className={"rb-btn" + (props.spell ? " is-on" : "")}
                onClick={props.onToggleSpell}
                title="Revisión de ortografía"
              >
                Ortografía
              </button>
              <button className="rb-btn" onClick={props.onAddNote} title="Añadir una nota en el margen">
                📝 Nota
              </button>
            </Group>

            <Group label="Esquema">
              <button
                className={"rb-btn" + (props.navOpen ? " is-on" : "")}
                onClick={props.onToggleNav}
                title="Navegador de escenas"
              >
                Escenas
              </button>
              <button className="rb-btn" onClick={props.onBeatBoard} title="Escaleta de tarjetas">
                Escaleta
              </button>
              <button className="rb-btn" onClick={props.onCharacters} title="Personajes y reportes">
                Personajes
              </button>
            </Group>

            <Group label="Documento">
              <button className="rb-btn" onClick={props.onDevelopment} title="Logline, tagline, sinopsis y tratamiento">
                Desarrollo
              </button>
              <button className="rb-btn" onClick={props.onPortada} title="Página de título">
                Portada
              </button>
              <Menu
                label="Archivo"
                items={[
                  { label: "Importar FDX…", onClick: props.onImportFdx },
                  { label: "Importar Fountain…", onClick: props.onImportFountain },
                  { label: "Exportar FDX", onClick: props.onExportFdx },
                  { label: "Exportar Fountain", onClick: props.onExportFountain },
                ]}
              />
              <button className="rb-btn rb-btn-primary" onClick={props.onPreview}>
                Páginas / PDF
              </button>
            </Group>
          </>
        )}

        {tab === "edicion" && (
          <Group label="Revisión">
            <div className="rb-swatches">
              {REVISIONS.map((r) => (
                <button
                  key={r.id}
                  className={"rb-swatch" + (props.revEnabled && props.revId === r.id ? " is-on" : "")}
                  style={{ background: r.hex }}
                  title={r.label}
                  onClick={() => props.onPickRevision(r.id)}
                />
              ))}
            </div>
            <button
              className={"rb-btn" + (props.revEnabled ? " is-on" : "")}
              onClick={props.revEnabled ? props.onDisableRevision : () => props.onPickRevision(props.revId)}
            >
              {props.revEnabled ? "Desactivar" : "Activar"}
            </button>
            <button className="rb-btn" onClick={props.onClearRevisions}>
              Limpiar marcas
            </button>
            <span className="rb-rev-status">
              {props.revEnabled
                ? `Marcando en ${REVISIONS.find((r) => r.id === props.revId)?.label ?? ""}`
                : "Desactivado"}
            </span>
          </Group>
        )}

        {tab === "herramientas" && (
          <>
            <Group label="Texto">
              <button className="rb-btn" onClick={props.onFindReplace} title="Buscar y reemplazar">
                Buscar / Reemplazar
              </button>
            </Group>
            <Group label="Borradores">
              <button className="rb-btn" onClick={props.onVersions} title="Control de versiones">
                Versiones
              </button>
            </Group>
            <Group label="Producción">
              <button className="rb-btn rb-btn-primary" onClick={props.onBreakdown} title="Desglose de guion">
                Desglose de guion
              </button>
            </Group>
            <Group label="Análisis">
              <button className="rb-btn" onClick={props.onNeural} title="Grafo estructural del guion">
                Red neuronal
              </button>
              <button className="rb-btn" onClick={props.onAnalysis} title="Análisis del guion (métricas + IA)">
                Análisis
              </button>
              <button className="rb-btn" onClick={props.onConceptBoard} title="Mapas, notas y líneas de tiempo">
                Pizarra
              </button>
            </Group>
            <Group label="Dirección">
              <button className="rb-btn rb-btn-primary" onClick={props.onDirection} title="Desglose técnico, storyboard y lista de planos">
                Dirección
              </button>
            </Group>
          </>
        )}
      </div>
    </div>
  );
}
