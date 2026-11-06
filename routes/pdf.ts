import { defineHandler } from "void/handler";
import { kv } from "void/kv";
import { pdfKey } from "../lib/cv";
import { access, preferences } from "../lib/reader";
import { pdfSchema } from "../lib/schema";

export const GET = defineHandler(async (c) => {
  const version = await access(c);
  if (version === null) return c.notFound();
  const { locale } = preferences(c);
  const stored = await kv.get(pdfKey(version, locale));
  if (stored === null) {
    throw new Error(`The ${version} PDF in ${locale} has not been published to KV.`);
  }
  const pdf = pdfSchema.parse(stored);
  const bytes = Uint8Array.from(atob(pdf.base64), (char) => char.charCodeAt(0));
  return c.body(bytes, 200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(pdf.filename)}`,
    "Cache-Control": "private, no-store",
  });
});
