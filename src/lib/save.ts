/**
 * Guardado y apertura de archivos que funciona tanto en web como en la app de
 * escritorio (Tauri). En web usa el método del navegador; en escritorio usa el
 * diálogo nativo "Guardar como" / "Abrir" y escribe el archivo con el plugin fs,
 * porque el webview de Tauri bloquea las descargas por enlace.
 */

export interface FileFilter {
  name: string;
  extensions: string[];
}

/** ¿Estamos dentro de la app de escritorio (Tauri)? */
export function isTauri(): boolean {
  return typeof window !== "undefined" && !!(window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
}

/* ---------- Descarga por navegador (web) ---------- */
function browserDownload(filename: string, data: Blob): void {
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Guardado nativo (escritorio) ----------
 * Elige la ruta con el diálogo nativo y la escribe con un comando propio de Rust
 * (write_file), evitando los ámbitos del plugin de sistema de archivos. */
async function tauriSave(filename: string, data: string | Uint8Array, filters?: FileFilter[]): Promise<boolean> {
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { invoke } = await import("@tauri-apps/api/core");
  const path = await save({ defaultPath: filename, filters });
  if (!path) return false; // el usuario canceló
  const bytes = typeof data === "string" ? Array.from(new TextEncoder().encode(data)) : Array.from(data);
  await invoke("write_file", { path, contents: bytes });
  return true;
}

/** Guarda texto (FDX, Fountain, CSV…). Devuelve true si se guardó. */
export async function saveText(
  filename: string,
  text: string,
  mime = "text/plain",
  filters?: FileFilter[],
): Promise<boolean> {
  if (isTauri()) return tauriSave(filename, text, filters);
  browserDownload(filename, new Blob([text], { type: `${mime};charset=utf-8` }));
  return true;
}

/** Guarda bytes (PDF). Devuelve true si se guardó. */
export async function saveBytes(
  filename: string,
  bytes: Uint8Array,
  mime = "application/octet-stream",
  filters?: FileFilter[],
): Promise<boolean> {
  if (isTauri()) return tauriSave(filename, bytes, filters);
  browserDownload(filename, new Blob([bytes as unknown as BlobPart], { type: mime }));
  return true;
}

/** Guarda un documento jsPDF (bytes) con el nombre dado. */
export async function savePdf(doc: import("jspdf").jsPDF, filename: string): Promise<boolean> {
  if (!isTauri()) {
    doc.save(filename);
    return true;
  }
  const bytes = new Uint8Array(doc.output("arraybuffer") as ArrayBuffer);
  return saveBytes(filename, bytes, "application/pdf", [{ name: "PDF", extensions: ["pdf"] }]);
}

/** Abre un archivo de texto (importar). Nativo en escritorio, input en web. */
export async function openTextFile(
  accept: string,
  filters?: FileFilter[],
): Promise<{ name: string; text: string } | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const selected = await open({ multiple: false, filters });
    if (!selected || typeof selected !== "string") return null;
    const text = await invoke<string>("read_file", { path: selected });
    const name = selected.split(/[\\/]/).pop() ?? "archivo";
    return { name, text };
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, text: String(reader.result) });
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
}
