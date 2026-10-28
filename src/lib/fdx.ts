/**
 * Import / Export de FDX (Final Draft XML).
 *
 * FDX guarda el guion como una lista de <Paragraph Type="...">, con el texto en
 * nodos <Text>. Mapeamos cada Type al tipo de elemento de Claqueta y viceversa.
 * El parseo es por expresiones regulares para funcionar igual en el navegador y
 * en Node (sin depender de DOMParser), suficiente para FDX estándar.
 */
import { ElementType } from "../editor/elements";
import { Block } from "./serialize";

const TO_FDX: Record<ElementType, string> = {
  scene_heading: "Scene Heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  shot: "Shot",
};

const FROM_FDX: Record<string, ElementType> = {
  "scene heading": "scene_heading",
  action: "action",
  general: "action",
  character: "character",
  parenthetical: "parenthetical",
  dialogue: "dialogue",
  transition: "transition",
  shot: "shot",
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&");
}

export function blocksToFdx(blocks: Block[]): string {
  const paras = blocks
    .filter((b) => (b.text ?? "").trim().length > 0)
    .map(
      (b) =>
        `    <Paragraph Type="${TO_FDX[b.type]}">\n      <Text>${escapeXml(
          b.text,
        )}</Text>\n    </Paragraph>`,
    )
    .join("\n");

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n` +
    `<FinalDraft DocumentType="Script" Template="No" Version="5">\n` +
    `  <Content>\n${paras}\n  </Content>\n` +
    `</FinalDraft>\n`
  );
}

export function fdxToBlocks(xml: string): Block[] {
  const blocks: Block[] = [];
  const paraRe = /<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/gi;
  const textRe = /<Text\b[^>]*>([\s\S]*?)<\/Text>/gi;

  let p: RegExpExecArray | null;
  while ((p = paraRe.exec(xml)) !== null) {
    const attrs = p[1];
    const inner = p[2];
    const typeMatch = /Type="([^"]*)"/i.exec(attrs);
    const typeName = (typeMatch?.[1] ?? "Action").trim().toLowerCase();
    const type = FROM_FDX[typeName] ?? "action";

    let text = "";
    let t: RegExpExecArray | null;
    textRe.lastIndex = 0;
    while ((t = textRe.exec(inner)) !== null) text += t[1];
    text = unescapeXml(text).trim();

    if (text) blocks.push({ type, text });
  }
  return blocks;
}
