import type { Cv, CvView, Link, LinkView, Locale, Rich, Segment, Version } from "./types";

/** The version a locked page shows, with its sensitive spans hidden. */
export const PUBLIC_VERSION: Version = "job";

export function cvKey(version: Version, locale: Locale): string {
  return `cv:${version}:${locale}`;
}

export function pdfKey(version: Version, locale: Locale): string {
  return `pdf:${version}:${locale}`;
}

/* One code unlocks every locale of its version. */
export function codeKey(version: Version): string {
  return `code:${version}`;
}

export async function digestCode(code: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.trim())),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const SENSITIVE = /\[\[(.+?)\]\]/g;

export function reveal(source: string): string {
  return source.replace(SENSITIVE, "$1");
}

const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });
/* CJK and full-width characters take about two `ch`. */
const WIDE =
  /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u;

/* A locked reader gets only the width in `ch` of each hidden span, never its text. */
function rich(source: string, unlocked: boolean): Rich {
  return source.split(SENSITIVE).flatMap((part, index): Segment[] => {
    if (part === "") return [];
    if (index % 2 === 0) return [{ kind: "text", text: part, sensitive: false }];
    if (unlocked) return [{ kind: "text", text: part, sensitive: true }];
    let width = 0;
    for (const { segment } of graphemes.segment(part)) width += WIDE.test(segment) ? 2 : 1;
    return [{ kind: "hidden", width }];
  });
}

function link(source: Link, unlocked: boolean): LinkView {
  const label = rich(source.label, unlocked);
  const hidesPart = label.some((segment) => segment.kind === "hidden");
  return { label, href: hidesPart ? null : source.href };
}

export function viewCv(cv: Cv, unlocked: boolean): CvView {
  return {
    name: rich(cv.name, unlocked),
    headline: rich(cv.headline, unlocked),
    location: rich(cv.location, unlocked),
    contacts: cv.contacts.map((contact) => link(contact, unlocked)),
    note: rich(cv.note, unlocked),
    summary: rich(cv.summary, unlocked),
    sections: cv.sections.map((section) => ({
      title: rich(section.title, unlocked),
      entries: section.entries.map((entry) => ({
        title: rich(entry.title, unlocked),
        role: entry.role === null ? null : rich(entry.role, unlocked),
        period: entry.period === null ? null : rich(entry.period, unlocked),
        links: entry.links.map((source) => link(source, unlocked)),
        points: entry.points.map((point) => rich(point, unlocked)),
        tags: entry.tags === null ? null : entry.tags.map((tag) => rich(tag, unlocked)),
      })),
    })),
  };
}
