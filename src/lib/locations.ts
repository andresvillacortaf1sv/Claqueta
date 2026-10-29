/**
 * Parseo de encabezados de escena en sus componentes de desglose:
 * interior/exterior, lugar y momento del día.
 */
export interface SceneLocation {
  ie: string; // INT. / EXT. / INT./EXT. / EST.
  place: string; // el lugar
  time: string; // DÍA / NOCHE / etc.
}

const IE_RE = /^(int\.?\/ext\.?|int\.?|ext\.?|est\.?|i\/e)\s*/i;

export function parseHeading(heading: string): SceneLocation {
  const raw = heading.trim();
  const ieMatch = raw.match(IE_RE);
  const ie = ieMatch ? ieMatch[1].toUpperCase().replace(/\.?$/, ".").replace(/\.\.$/, ".") : "";
  let rest = raw.replace(IE_RE, "").trim();

  // El momento del día suele ir tras el último " - "
  let time = "";
  let place = rest;
  const dashIdx = rest.lastIndexOf(" - ");
  if (dashIdx !== -1) {
    place = rest.slice(0, dashIdx).trim();
    time = rest.slice(dashIdx + 3).trim();
  }
  return { ie, place: place.toUpperCase(), time: time.toUpperCase() };
}

export interface LocationStat {
  place: string;
  scenes: number;
  interiors: number;
  exteriors: number;
  times: string[];
}

export function getLocations(headings: string[]): LocationStat[] {
  const map = new Map<string, { scenes: number; interiors: number; exteriors: number; times: Set<string> }>();
  for (const h of headings) {
    const { ie, place, time } = parseHeading(h);
    if (!place) continue;
    if (!map.has(place)) map.set(place, { scenes: 0, interiors: 0, exteriors: 0, times: new Set() });
    const e = map.get(place)!;
    e.scenes++;
    if (/INT/.test(ie)) e.interiors++;
    if (/EXT/.test(ie)) e.exteriors++;
    if (time) e.times.add(time);
  }
  return [...map.entries()]
    .map(([place, e]) => ({
      place,
      scenes: e.scenes,
      interiors: e.interiors,
      exteriors: e.exteriors,
      times: [...e.times],
    }))
    .sort((a, b) => b.scenes - a.scenes || a.place.localeCompare(b.place));
}
