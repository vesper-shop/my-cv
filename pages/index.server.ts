import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { defineHead, type InferProps } from "void";
import { ValidationError, defineHandler } from "void/handler";
import { kv } from "void/kv";
import { z } from "zod";
import {
  PUBLIC_VERSION,
  VERSIONS,
  codeKey,
  cvKey,
  cvSchema,
  digestCode,
  viewCv,
  type Version,
} from "../lib/cv";
import { MESSAGES } from "../lib/i18n";
import { LOCALES, THEMES, localeFromHeader } from "../lib/preferences";

/** Holds the digest of the code a reader entered, so changing a code revokes access. */
const ACCESS_COOKIE = "cv_access";
const LOCALE_COOKIE = "cv_locale";
const THEME_COOKIE = "cv_theme";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const localeSchema = z.enum(LOCALES);
const themeSchema = z.enum(THEMES);
/** An access cookie is the hex SHA-256 digest of a code. */
const accessSchema = z.string().regex(/^[0-9a-f]{64}$/);

function cookieOptions(c: Context, maxAge: number) {
  return {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax" as const,
    path: "/",
    maxAge,
  };
}

/** The reader's language and theme: a saved choice, else the browser's language and system theme. */
function preferences(c: Context) {
  const savedLocale = localeSchema.safeParse(getCookie(c, LOCALE_COOKIE));
  const savedTheme = themeSchema.safeParse(getCookie(c, THEME_COOKIE));
  return {
    locale: savedLocale.success
      ? savedLocale.data
      : localeFromHeader(c.req.raw.headers.get("Accept-Language")),
    theme: savedTheme.success ? savedTheme.data : ("system" as const),
  };
}

/** Compares two hex digests in time that does not depend on where they differ. */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
}

/** The version whose stored code digest matches `digest`, or `null`. */
async function versionFor(digest: string): Promise<Version | null> {
  for (const version of VERSIONS) {
    const stored = await kv.get<string>(codeKey(version));
    if (stored !== null && sameDigest(digest, stored)) return version;
  }
  return null;
}

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const { locale, theme } = preferences(c);
  const cookie = accessSchema.safeParse(getCookie(c, ACCESS_COOKIE));
  const access = cookie.success ? await versionFor(cookie.data) : null;
  const version = access === null ? PUBLIC_VERSION : access;
  const stored = await kv.get(cvKey(version, locale));
  if (stored === null) {
    throw new Error(`The ${version} CV in ${locale} has not been published to KV.`);
  }
  return { access, locale, theme, cv: viewCv(cvSchema.parse(stored), access !== null) };
});

/*
 * Every action changes a cookie and then redirects: an action re-runs the loader within the same
 * request, which still carries the old cookies, so only a fresh GET renders the new state.
 */
export const head = defineHead<Props>((_c, props) => ({
  title: MESSAGES[props.locale].title,
  meta: [{ name: "description", content: MESSAGES[props.locale].description }],
  htmlAttrs: { lang: props.locale === "zh" ? "zh-CN" : "en" },
}));

export const actions = {
  unlock: defineHandler.withValidator({ body: z.object({ code: z.string().trim() }) })(
    async (c, { body }) => {
      const messages = MESSAGES[preferences(c).locale];
      if (body.code === "") throw new ValidationError({ code: messages.codeRequired });
      const digest = await digestCode(body.code);
      if ((await versionFor(digest)) === null) {
        throw new ValidationError({ code: messages.codeRejected });
      }
      setCookie(c, ACCESS_COOKIE, digest, cookieOptions(c, 60 * 60 * 24 * 30));
      return c.redirect("/");
    },
  ),

  lock: defineHandler((c) => {
    deleteCookie(c, ACCESS_COOKIE, { path: "/" });
    return c.redirect("/");
  }),

  locale: defineHandler.withValidator({ body: z.object({ locale: localeSchema }) })(
    (c, { body }) => {
      setCookie(c, LOCALE_COOKIE, body.locale, cookieOptions(c, COOKIE_MAX_AGE));
      return c.redirect("/");
    },
  ),

  theme: defineHandler.withValidator({ body: z.object({ theme: themeSchema }) })((c, { body }) => {
    setCookie(c, THEME_COOKIE, body.theme, cookieOptions(c, COOKIE_MAX_AGE));
    return c.redirect("/");
  }),
};
