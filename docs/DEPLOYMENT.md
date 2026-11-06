# Deployment

The site deploys as the `my-cv` Cloudflare Worker, bound to `cv.you-find.me` in `void.config.ts`.
Workers Builds deploys every push to `main` with `void deploy --platform cloudflare`. The Worker has
no secrets or environment variables; its only binding is the `KV` namespace Void provisions.

## Changing the CV or a code

Content and codes are data, not code: change them with `pnpm cv` and the next request serves them.
`<target>` is the production KV namespace ID, or a dev server origin such as `http://localhost:5173`.

```bash
# Edit data/private/<grad|job>.<en|zh>.json, then publish each file you changed:
pnpm cv publish <target> grad en data/private/grad.en.json
pnpm cv publish <target> grad zh data/private/grad.zh.json
pnpm cv publish <target> job en data/private/job.en.json
pnpm cv publish <target> job zh data/private/job.zh.json

# Set or rotate a code (prompted, at least 8 characters):
pnpm cv code <target> grad
pnpm cv code <target> job
```

Rotating a code signs out every reader who unlocked that version with the old one.

## First deploy

1. Push to `main` and let Workers Builds deploy; Void creates the `KV` namespace.
2. Find the namespace ID in the Cloudflare dashboard or with `cf kv namespaces list`.
3. Publish all four CV files and set both codes against that ID.

Until every version and locale is published, the page responds with an error naming the missing one.
