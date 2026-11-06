import { deleteCookie, setCookie } from "hono/cookie";
import { defineHead, type InferProps } from "void";
import { ValidationError, defineHandler } from "void/handler";
import { kv } from "void/kv";
import { z } from "zod";
import { PUBLIC_VERSION, cvKey, digestCode, viewCv } from "../lib/cv";
import { MESSAGES } from "../lib/i18n";
import {
  ACCESS_COOKIE,
  LOCALE_COOKIE,
  THEME_COOKIE,
  access,
  cookieOptions,
  preferences,
  versionFor,
} from "../lib/reader";
import { cvSchema, localeSchema, themeSchema } from "../lib/schema";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type Props = InferProps<typeof loader>;

export const loader = defineHandler(async (c) => {
  const { locale, theme } = preferences(c);
  const unlocked = await access(c);
  const version = unlocked === null ? PUBLIC_VERSION : unlocked;
  const stored = await kv.get(cvKey(version, locale));
  if (stored === null) {
    throw new Error(`The ${version} CV in ${locale} has not been published to KV.`);
  }
  return {
    access: unlocked,
    locale,
    theme,
    cv: viewCv(cvSchema.parse(stored), unlocked !== null),
  };
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
