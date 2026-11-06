/** What a reader chooses about how the page looks: its language and colour theme. */

export const LOCALES = ["en", "zh"] as const;
export type Locale = (typeof LOCALES)[number];

export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

/** Picks a locale from an `Accept-Language` header: Chinese when listed before English. */
export function localeFromHeader(header: string | null): Locale {
  if (header === null) return "en";
  const zh = header.search(/\bzh\b/i);
  const en = header.search(/\ben\b/i);
  return zh !== -1 && (en === -1 || zh < en) ? "zh" : "en";
}
