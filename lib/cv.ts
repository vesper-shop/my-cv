import { z } from "zod";
import type { Locale } from "./preferences";

/**
 * A CV is authored as plain strings in which `[[...]]` marks a sensitive
 * span, for example `"Shipped [[178]] merged pull requests"`. The server
 * turns every string into segments: unlocked readers get the text, everyone
 * else only learns how long each hidden span is.
 */

export const VERSIONS = ["grad", "job"] as const;
export type Version = (typeof VERSIONS)[number];

/** The version a locked page shows, with its sensitive spans hidden. */
export const PUBLIC_VERSION: Version = "job";

/*
 * KV layout, shared by the page and `scripts/cv.ts`: `cv:<version>:<locale>`
 * holds a CV and `code:<version>` the SHA-256 digest of the code that unlocks
 * every locale of that version.
 */
export function cvKey(version: Version, locale: Locale): string {
  return `cv:${version}:${locale}`;
}

export function codeKey(version: Version): string {
  return `code:${version}`;
}

/** Hex SHA-256 digest of an access code, as stored in KV and in the access cookie. */
export async function digestCode(code: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(code.trim())),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

const linkSchema = z.object({
  label: z.string(),
  href: z.url(),
});

const entrySchema = z.object({
  title: z.string(),
  role: z.string().nullable(),
  period: z.string().nullable(),
  link: linkSchema.nullable(),
  points: z.array(z.string()),
  tags: z.array(z.string()).nullable(),
});

export const cvSchema = z.object({
  name: z.string(),
  headline: z.string(),
  location: z.string(),
  contacts: z.array(linkSchema),
  note: z.string(),
  summary: z.string(),
  sections: z.array(
    z.object({
      title: z.string(),
      entries: z.array(entrySchema),
    }),
  ),
});

export type Cv = z.infer<typeof cvSchema>;

export type Segment =
  | { kind: "text"; text: string; sensitive: boolean }
  | { kind: "hidden"; width: number };

export type Rich = Segment[];

export interface LinkView {
  label: Rich;
  /** Withheld while locked when the label contains a sensitive span. */
  href: string | null;
}

export interface EntryView {
  title: Rich;
  role: Rich | null;
  period: Rich | null;
  link: LinkView | null;
  points: Rich[];
  tags: Rich[] | null;
}

export interface CvView {
  name: Rich;
  headline: Rich;
  location: Rich;
  contacts: LinkView[];
  note: Rich;
  summary: Rich;
  sections: { title: Rich; entries: EntryView[] }[];
}

const SENSITIVE = /\[\[(.+?)\]\]/g;
const graphemes = new Intl.Segmenter("en", { granularity: "grapheme" });
/** CJK and full-width characters, which take about two `ch` of width. */
const WIDE =
  /[\u1100-\u115f\u2e80-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe30-\ufe4f\uff00-\uff60\uffe0-\uffe6]/u;

/** The width of `text` in `ch`, so a redaction bar covers the space the text would take. */
function displayWidth(text: string): number {
  let width = 0;
  for (const { segment } of graphemes.segment(text)) width += WIDE.test(segment) ? 2 : 1;
  return width;
}

function rich(source: string, unlocked: boolean): Rich {
  return source.split(SENSITIVE).flatMap((part, index): Segment[] => {
    if (part === "") return [];
    if (index % 2 === 0) return [{ kind: "text", text: part, sensitive: false }];
    return unlocked
      ? [{ kind: "text", text: part, sensitive: true }]
      : [{ kind: "hidden", width: displayWidth(part) }];
  });
}

function link(source: Cv["contacts"][number], unlocked: boolean): LinkView {
  const label = rich(source.label, unlocked);
  const hidesPart = label.some((segment) => segment.kind === "hidden");
  return { label, href: hidesPart ? null : source.href };
}

/** Projects a stored CV into what a reader may see. */
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
        link: entry.link === null ? null : link(entry.link, unlocked),
        points: entry.points.map((point) => rich(point, unlocked)),
        tags: entry.tags === null ? null : entry.tags.map((tag) => rich(tag, unlocked)),
      })),
    })),
  };
}
