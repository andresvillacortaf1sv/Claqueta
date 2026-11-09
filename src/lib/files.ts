/** Compatibilidad: delega en el guardador universal (web + escritorio). */
import { saveText, openTextFile, FileFilter } from "./save";

export function downloadText(filename: string, text: string, mime = "text/plain", filters?: FileFilter[]): void {
  void saveText(filename, text, mime, filters);
}

export function pickTextFile(accept: string, filters?: FileFilter[]): Promise<{ name: string; text: string } | null> {
  return openTextFile(accept, filters);
}
