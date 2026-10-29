import { useState } from "react";
import { Version, blocksToLines } from "../lib/versions";
import { Block } from "../lib/serialize";
import { diffLines, diffStats } from "../lib/diff";

interface Props {
  versions: Version[];
  current: Block[];
  onSave: (name: string) => void;
  onRestore: (v: Version) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function VersionsPanel({ versions, current, onSave, onRestore, onDelete, onClose }: Props) {
  const [name, setName] = useState("");
  const [compareId, setCompareId] = useState<string | null>(null);

  const compare = versions.find((v) => v.id === compareId) ?? null;
  const ops = compare ? diffLines(blocksToLines(compare.blocks), blocksToLines(current)) : null;
  const stats = ops ? diffStats(ops) : null;

  return (
    <div className="modal-overlay" role="dialog" aria-label="Versiones">
      <div className="versions-modal">
        <div className="versions-head">
          <h2 className="modal-title">Control de versiones</h2>
          <button className="btn-ghost" onClick={onClose}>
            Cerrar
          </button>
        </div>

        <div className="versions-save">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del borrador (p. ej. «Primer acto listo»)"
          />
          <button
            className="btn-primary"
            onClick={() => {
              onSave(name);
              setName("");
            }}
          >
            Guardar versión actual
          </button>
        </div>

        <div className="versions-body">
          <ul className="versions-list">
            {versions.map((v) => (
              <li key={v.id} className={compareId === v.id ? "is-sel" : ""}>
                <div className="ver-main">
                  <span className="ver-name">{v.name}</span>
                  <span className="ver-date">{new Date(v.date).toLocaleString("es")}</span>
                </div>
                <div className="ver-actions">
                  <button onClick={() => setCompareId(v.id)}>Comparar</button>
                  <button onClick={() => onRestore(v)}>Restaurar</button>
                  <button onClick={() => onDelete(v.id)}>Borrar</button>
                </div>
              </li>
            ))}
            {versions.length === 0 && <li className="ver-empty">Sin versiones guardadas todavía.</li>}
          </ul>

          <div className="versions-diff">
            {!compare && (
              <div className="diff-empty">
                Pulsa «Comparar» en una versión para ver, línea a línea, qué cambió frente al guion
                actual.
              </div>
            )}
            {compare && ops && stats && (
              <>
                <div className="diff-stats">
                  <span className="add">+{stats.added}</span>
                  <span className="del">−{stats.removed}</span>
                  <span className="diff-label">«{compare.name}» → guion actual</span>
                </div>
                <div className="diff-view">
                  {ops.map((o, i) => (
                    <div key={i} className={"diff-line " + o.kind}>
                      <span className="diff-mark">
                        {o.kind === "add" ? "+" : o.kind === "del" ? "−" : " "}
                      </span>
                      <span className="diff-text">{o.text}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
