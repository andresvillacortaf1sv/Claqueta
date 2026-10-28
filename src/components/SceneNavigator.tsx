import { Scene } from "../lib/scenes";

interface Props {
  scenes: Scene[];
  onJump: (pos: number) => void;
  onClose: () => void;
}

export function SceneNavigator({ scenes, onJump, onClose }: Props) {
  return (
    <aside className="scene-nav">
      <div className="scene-nav-head">
        <span>Escenas ({scenes.length})</span>
        <button className="scene-nav-close" onClick={onClose} title="Cerrar">
          ×
        </button>
      </div>
      <ul className="scene-list">
        {scenes.map((s) => (
          <li key={s.pos}>
            <button className="scene-item" onClick={() => onJump(s.pos)}>
              <span className="scene-num">{s.order + 1}</span>
              <span className="scene-head">{s.heading}</span>
            </button>
          </li>
        ))}
        {scenes.length === 0 && (
          <li className="scene-empty">Sin escenas. Crea un encabezado tecleando INT. o EXT.</li>
        )}
      </ul>
    </aside>
  );
}
