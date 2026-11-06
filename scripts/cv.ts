/**
 *   pnpm cv publish <target> <grad|job> <en|zh> <file>   validate a CV, render its PDF, store both
 *   pnpm cv code <target> <grad|job>                     prompt for a new code and store its digest
 *
 * <target> is a local dev server origin, such as http://localhost:5173, or
 * `production`, which is written with the `cf` CLI. Both hold the namespace
 * that `void.lock.json` records for the `KV` binding.
 * Changing a code signs out every reader who unlocked that version with the old one.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { z } from "zod";
import { codeKey, cvKey, digestCode, pdfKey } from "../lib/cv";
import { codeSchema, cvSchema, localeSchema, versionSchema } from "../lib/schema";
import type { Cv, StoredPdf } from "../lib/types";
import { renderCvPdf } from "./pdf";

const targetSchema = z.union([z.literal("production"), z.url()]);

const lockSchema = z.object({
  resolved: z.object({
    kv_namespaces: z.tuple([z.object({ binding: z.literal("KV"), id: z.string() })]),
  }),
});

const namespace = lockSchema.parse(JSON.parse(readFileSync("void.lock.json", "utf8"))).resolved
  .kv_namespaces[0].id;

const commandSchema = z.union([
  z.tuple([z.literal("publish"), targetSchema, versionSchema, localeSchema, z.string().min(1)]),
  z.tuple([z.literal("code"), targetSchema, versionSchema]),
]);

async function put(target: string, key: string, value: Cv | StoredPdf | string): Promise<void> {
  const body = JSON.stringify(value);
  if (target !== "production") {
    const url = new URL(
      `/cdn-cgi/local/explorer/api/storage/kv/namespaces/${namespace}/values/${key}`,
      target,
    );
    const response = await fetch(url, { method: "PUT", body });
    if (!response.ok)
      throw new Error(`Local KV rejected ${key}: ${response.status} ${await response.text()}`);
    return;
  }
  /* A PDF is too large for a command-line argument. */
  execFileSync(
    "cf",
    ["kv", "keys", "put", key, "--namespace-id", namespace, "--file", "/dev/stdin"],
    {
      input: body,
      stdio: ["pipe", "inherit", "inherit"],
    },
  );
}

const command = commandSchema.parse(process.argv.slice(2));

if (command[0] === "publish") {
  const [, target, version, locale, file] = command;
  const cv = cvSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  const pdf = await renderCvPdf(cv, locale);
  await put(target, cvKey(version, locale), cv);
  await put(target, pdfKey(version, locale), pdf);
  console.log(`Published ${file} and ${pdf.filename} as the ${version} CV in ${locale}.`);
} else {
  const [, target, version] = command;
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  const code = codeSchema.parse(await prompt.question(`New access code for the ${version} CV: `));
  prompt.close();
  await put(target, codeKey(version), await digestCode(code));
  console.log(
    `Updated the ${version} access code. Readers who used the old code must enter the new one.`,
  );
}
