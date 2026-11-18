/**
 * Presentation-only parser for owner-approved menu text. It never rewrites or drops words: it only
 * separates a leading quoted tagline, "Label: item, item" courses and unlabelled notes so a menu can
 * be set as a card instead of a paragraph. Prose with no labelled course returns null and renders
 * as the original paragraph.
 */
export interface MenuCourse {
  label: string;
  items: string[];
}

export interface ParsedMenu {
  tagline?: string;
  courses: MenuCourse[];
  notes: string[];
}

const MAX_LABEL_WORDS = 3;

export function parseMenuBody(body: string): ParsedMenu | null {
  let rest = body.trim();
  let tagline: string | undefined;
  const quoted = /^“([^”]+)”\s*/.exec(rest);
  if (quoted?.[1]) {
    tagline = quoted[1].trim();
    rest = rest.slice(quoted[0].length);
  }

  const courses: MenuCourse[] = [];
  const notes: string[] = [];
  const sentences = rest
    .split(/\.\s+(?=[A-Z“])/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

  for (const sentence of sentences) {
    const match = /^([^:]+):\s*(.+)$/.exec(sentence);
    const label = match?.[1]?.trim();
    if (match && label && label.split(/\s+/).length <= MAX_LABEL_WORDS) {
      const items = (match[2] ?? "")
        .split(/,\s*/)
        .map((i) => i.trim())
        .filter(Boolean);
      if (items.length > 0) {
        courses.push({ label, items });
        continue;
      }
    }
    notes.push(sentence);
  }

  if (courses.length === 0) return null;
  return tagline === undefined ? { courses, notes } : { tagline, courses, notes };
}
