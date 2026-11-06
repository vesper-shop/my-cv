import { defineConfig } from "void/config";

export default defineConfig({
  target: "cloudflare",
  head: {
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    link: [{ rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }],
  },
  routing: {
    typedRoutes: true,
  },
  cloudflare: {
    name: "my-cv",
    account_id: "fb71c4eceaf623ae1b19b8b37d7a38cf",
    compatibility_date: "2026-08-01",
    upload_source_maps: true,
    workers_dev: false,
    preview_urls: false,
    routes: [{ pattern: "cv.you-find.me", custom_domain: true }],
    observability: {
      logs: { enabled: true, invocation_logs: true },
    },
  },
});
