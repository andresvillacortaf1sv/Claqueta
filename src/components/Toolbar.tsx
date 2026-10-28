import { ElementType, ELEMENT_LABELS, TAB_CYCLE } from "../editor/elements";

interface Props {
  current: ElementType;
  onPick: (type: ElementType) => void;
  onPreview: () => void;
}

export function Toolbar({ current, onPick, onPreview }: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-brand">
        <span className="toolbar-logo">◉</span>
        <span className="toolbar-title">Claqueta</span>
        <span className="toolbar-sub">guion sin título</span>
      </div>

      <div className="toolbar-elements" role="toolbar" aria-label="Elementos">
        {TAB_CYCLE.map((type, i) => (
          <button
            key={type}
            className={"el-btn" + (type === current ? " is-active" : "")}
            onClick={() => onPick(type)}
            title={`${ELEMENT_LABELS[type]}  ·  Ctrl/Cmd+${i + 1}`}
          >
            <span className="el-btn-num">{i + 1}</span>
            {ELEMENT_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="toolbar-end">
        <button className="btn-primary" onClick={onPreview} title="Vista paginada y exportar PDF">
          Páginas / PDF
        </button>
      </div>
    </div>
  );
}
