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
  const [tab, setTab] = useState<"inicio" | "edicion">("inicio");
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
        </div>
      </div>

      <div className="ribbon-panel">
        {tab === "inicio" ? (
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

            <Group label="Documento">
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
        ) : (
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
      </div>
    </div>
  );
}
