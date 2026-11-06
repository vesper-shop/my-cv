# my-cv

A CV that hides its sensitive details until a reader enters an access code. Different codes unlock
the graduate-application and job-application versions, each in English and Chinese, with light and
dark themes.

A locked reader only ever receives redaction bars, so the hidden text is not in the page source.
Codes are checked on the server against digests stored in KV, and changing a code revokes access
granted with the old one.

## Develop

```bash
pnpm install
pnpm dev
pnpm cv publish http://localhost:5173 job en data/example.json
pnpm cv publish http://localhost:5173 job zh data/example.json
pnpm cv code http://localhost:5173 job
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## License

[AGPL-3.0](LICENSE)
