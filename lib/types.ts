import type { z } from "zod";
import type {
  cvSchema,
  entrySchema,
  linkSchema,
  localeSchema,
  pdfSchema,
  themeSchema,
  versionSchema,
} from "./schema";

export type Version = z.infer<typeof versionSchema>;
export type Locale = z.infer<typeof localeSchema>;
export type Theme = z.infer<typeof themeSchema>;

export type Cv = z.infer<typeof cvSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Link = z.infer<typeof linkSchema>;
export type StoredPdf = z.infer<typeof pdfSchema>;

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
  links: LinkView[];
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

export interface Messages {
  title: string;
  description: string;
  summary: string;
  hireTitle: string;
  codePlaceholder: string;
  unlock: string;
  checking: string;
  codeRequired: string;
  codeRejected: string;
  unlockedAs: (version: Version) => string;
  hide: string;
  toggleTheme: string;
  switchLocale: string;
  downloadPdf: string;
}
