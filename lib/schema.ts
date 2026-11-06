import { z } from "zod";

export const VERSIONS = ["grad", "job"] as const;
export const LOCALES = ["en", "zh"] as const;
export const THEMES = ["system", "light", "dark"] as const;

export const versionSchema = z.enum(VERSIONS);
export const localeSchema = z.enum(LOCALES);
export const themeSchema = z.enum(THEMES);

export const codeSchema = z.string().trim().min(6, "Use an access code of at least 6 characters.");

export const digestSchema = z.string().regex(/^[0-9a-f]{64}$/);

/* CV strings mark a sensitive span as `[[...]]`, for example `"Shipped [[178]] pull requests"`. */
export const linkSchema = z.object({
  label: z.string(),
  href: z.url(),
});

export const entrySchema = z.object({
  title: z.string(),
  role: z.string().nullable(),
  period: z.string().nullable(),
  links: z.array(linkSchema),
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

/* KV holds JSON, so the PDF bytes are base64. */
export const pdfSchema = z.object({
  filename: z.string(),
  base64: z.base64(),
});
