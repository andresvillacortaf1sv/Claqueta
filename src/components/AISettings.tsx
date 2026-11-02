import { useState } from "react";
import { AIConfig, Provider, PROVIDER_DEFAULTS } from "../lib/ai";

interface Props {
  initial: AIConfig | null;
  onSave: (cfg: AIConfig) => void;
  onClose: () => void;
}

export function AISettings({ initial, onSave, onClose }: Props) {
  const [cfg, setCfg] = useState<AIConfig>(
    initial ?? { provider: "anthropic", ...PROVIDER_DEFAULTS.anthropic, apiKey: "" },
  );

  const setProvider = (p: Provider) =>
    setCfg((c) => ({ ...c, provider: p, baseURL: PROVIDER_DEFAULTS[p].baseURL, model: PROVIDER_DEFAULTS[p].model }));

  return (
    <div className="modal-overlay" role="dialog" aria-label="Ajustes de IA">
      <div className="modal">
        <h2 className="modal-title">Conectar IA (tu propia clave)</h2>
        <p className="ai-note">
          La clave se guarda sólo en tu dispositivo. Por CORS, funcionan de forma fiable Anthropic,
          OpenRouter y Ollama local.
        </p>

        <label className="field">
          <span>Proveedor</span>
          <select value={cfg.provider} onChange={(e) => setProvider(e.target.value as Provider)}>
            {(Object.keys(PROVIDER_DEFAULTS) as Provider[]).map((p) => (
              <option key={p} value={p}>
                {PROVIDER_DEFAULTS[p].label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Endpoint (base URL)</span>
          <input value={cfg.baseURL} onChange={(e) => setCfg((c) => ({ ...c, baseURL: e.target.value }))} />
        </label>
        <label className="field">
          <span>Modelo</span>
          <input value={cfg.model} onChange={(e) => setCfg((c) => ({ ...c, model: e.target.value }))} />
        </label>
        <label className="field">
          <span>Clave API {cfg.provider === "ollama" ? "(no necesaria)" : ""}</span>
          <input
            type="password"
            value={cfg.apiKey}
            onChange={(e) => setCfg((c) => ({ ...c, apiKey: e.target.value }))}
            placeholder="sk-…"
          />
        </label>

        {cfg.provider === "anthropic" && (
          <label className="field">
            <span>Workspace ID (opcional)</span>
            <input
              value={cfg.workspaceId ?? ""}
              onChange={(e) => setCfg((c) => ({ ...c, workspaceId: e.target.value }))}
              placeholder="Sólo si tu clave da error de workspace"
            />
            <small className="ai-hint">
              Si ves el error «not scoped to a workspace», pega aquí el ID del workspace
              (Anthropic Console → Settings → Workspaces), o usa una clave creada dentro de un
              workspace.
            </small>
          </label>
        )}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-primary" onClick={() => { onSave(cfg); onClose(); }}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
