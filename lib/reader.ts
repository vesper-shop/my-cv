import type { Context } from "hono";
import { getCookie } from "hono/cookie";
import { kv } from "void/kv";
import { codeKey } from "./cv";
import { VERSIONS, digestSchema, localeSchema, themeSchema } from "./schema";
import type { Locale, Theme, Version } from "./types";

/* Holds the digest of the code a reader entered, so changing a code revokes access. */
export const ACCESS_COOKIE = "cv_access";
export const LOCALE_COOKIE = "cv_locale";
export const THEME_COOKIE = "cv_theme";

export function cookieOptions(c: Context, maxAge: number) {
  return {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

export function preferences(c: Context): { locale: Locale; theme: Theme } {
  const savedLocale = localeSchema.safeParse(getCookie(c, LOCALE_COOKIE));
  const savedTheme = themeSchema.safeParse(getCookie(c, THEME_COOKIE));
  const header = c.req.raw.headers.get("Accept-Language");
  const zh = header === null ? -1 : header.search(/\bzh\b/i);
  const en = header === null ? -1 : header.search(/\ben\b/i);
  return {
    locale: savedLocale.success
      ? savedLocale.data
      : zh !== -1 && (en === -1 || zh < en)
        ? "zh"
        : "en",
    theme: savedTheme.success ? savedTheme.data : "system",
  };
}

export async function versionFor(digest: string): Promise<Version | null> {
  for (const version of VERSIONS) {
    const stored = await kv.get<string>(codeKey(version));
    if (stored === null || stored.length !== digest.length) continue;
    /* Constant time, so response timing does not reveal how much of a digest matched. */
    let difference = 0;
    for (let index = 0; index < digest.length; index++) {
      difference |= digest.charCodeAt(index) ^ stored.charCodeAt(index);
    }
    if (difference === 0) return version;
  }
  return null;
}

export async function access(c: Context): Promise<Version | null> {
  const cookie = digestSchema.safeParse(getCookie(c, ACCESS_COOKIE));
  return cookie.success ? versionFor(cookie.data) : null;
}
