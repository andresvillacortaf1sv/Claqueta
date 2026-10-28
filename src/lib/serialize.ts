/**
 * Convierte el documento ProseMirror en una lista plana de bloques
 * { tipo, texto }, que es lo que consumen el paginador y el exportador a PDF.
 */
import { Node as PMNode } from "prosemirror-model";
import { ElementType, isElementType } from "../editor/elements";

export interface Block {
  type: ElementType;
  text: string;
}

export function docToBlocks(doc: PMNode): Block[] {
  const out: Block[] = [];
  doc.forEach((node) => {
    const name = node.type.name;
    if (isElementType(name)) {
      out.push({ type: name, text: node.textContent });
    }
  });
  return out;
}
