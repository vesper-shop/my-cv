# Architecture

## Request flow

```text
GET /             pages/index.server.ts loader
                  -> match the `cv_access` cookie against `code:grad` / `code:job` in KV
                  -> pick the locale (cookie, else Accept-Language) and theme (cookie, else system)
                  -> read `cv:<version>:<locale>` from KV (`cv:job:<locale>` while locked)
                  -> validate with `cvSchema`, project with `viewCv(cv, unlocked)`
                  -> pages/index.tsx renders text or redaction bars, blurring later sections behind the lock

POST /?unlock     digest the submitted code and match it against the stored digests
                  -> set the HttpOnly `cv_access` cookie to that digest, or a `code` validation error
POST /?lock       delete the cookie
POST /?locale     remember `en` or `zh`
POST /?theme      remember `system`, `light`, or `dark`
```

The cookie holds the SHA-256 digest of the code, never the code. Because it is compared with the
current digest on every request, changing a code locks out everyone who used the old one.

## KV

| Key          | Value                                                     |
| ------------ | --------------------------------------------------------- |
| `cv:grad:en` | Graduate-application CV in English                        |
| `cv:grad:zh` | Graduate-application CV in Chinese                        |
| `cv:job:en`  | Job-application CV in English, shown redacted when locked |
| `cv:job:zh`  | Job-application CV in Chinese, shown redacted when locked |
| `code:grad`  | Hex SHA-256 digest of the graduate-application code       |
| `code:job`   | Hex SHA-256 digest of the job-application code            |

## CV format

A CV is JSON matching `cvSchema` in `lib/cv.ts`. Any string may mark sensitive spans with `[[...]]`.
While locked, each span becomes `{ kind: "hidden", width }`, its width in `ch` with CJK characters counted as two, so the page
keeps its shape without the text. While locked, the page shows
the header, summary, and first section, and blurs the remaining (already redacted) sections behind
the inline unlock form. Contacts and entry links lose their `href` when their label hides
a span. `role`, `period`, `link`, and `tags` are required and `null` when absent. A skills row sets `role`,
`period`, and `link` to `null`, leaves `points` empty, and lists its items as `tags`, which render as
chips.
