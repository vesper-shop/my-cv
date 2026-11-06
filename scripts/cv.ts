/**
 * Changes the CV or its access codes in KV. Nothing needs redeploying: the
 * next request reads the new values.
 *
 *   pnpm cv publish <target> <grad|job> <en|zh> <file>   validate a CV file and store it
 *   pnpm cv code <target> <grad|job>                     prompt for a new code and store its digest
 *
 * <target> is a local dev server origin, such as http://localhost:5173, or the
 * ID of the production KV namespace, which is written with the `cf` CLI.
 * Changing a code signs out every reader who unlocked that version with the old one.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { z } from "zod";
import { VERSIONS, codeKey, cvKey, cvSchema, digestCode, type Cv } from "../lib/cv.ts";
import { LOCALES } from "../lib/preferences.ts";

const commandSchema = z.union([
  z.tuple([
    z.literal("publish"),
    z.string().min(1),
    z.enum(VERSIONS),
    z.enum(LOCALES),
    z.string().min(1),
  ]),
  z.tuple([z.literal("code"), z.string().min(1), z.enum(VERSIONS)]),
]);

const codeSchema = z.string().trim().min(8, "Use an access code of at least 8 characters.");

/** Writes one JSON value to KV on a local dev server or in the production namespace. */
async function put(target: string, key: string, value: Cv | string): Promise<void> {
  const body = JSON.stringify(value);
  if (URL.canParse(target)) {
    const url = new URL(
      `/cdn-cgi/local/explorer/api/storage/kv/namespaces/local/values/${key}`,
      target,
    );
    const response = await fetch(url, { method: "PUT", body });
    if (!response.ok)
      throw new Error(`Local KV rejected ${key}: ${response.status} ${await response.text()}`);
    return;
  }
  execFileSync("cf", ["kv", "keys", "put", key, "--namespace-id", target, "--body", body], {
    stdio: "inherit",
  });
}

const command = commandSchema.parse(process.argv.slice(2));

if (command[0] === "publish") {
  const [, target, version, locale, file] = command;
  const cv = cvSchema.parse(JSON.parse(readFileSync(file, "utf8")));
  await put(target, cvKey(version, locale), cv);
  console.log(`Published ${file} as the ${version} CV in ${locale}.`);
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
