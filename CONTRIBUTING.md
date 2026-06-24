# Contributing to the A2Me MCP Server

Thanks for your interest! This server exposes **read-only** family-context tools
for the [A2Me](https://a2me.app) family platform over the
[Model Context Protocol](https://modelcontextprotocol.io).

## Getting started

```bash
npm install
npm run dev        # run locally (stdio transport, mock data by default)
npm test           # vitest unit tests
npm run check      # type-check
npm run lint       # lint
npm run format     # format
npm run build      # compile to dist/
```

By default the server runs in **mock mode** (`A2ME_USE_MOCK=true`), so you can
develop without a backend. To call a real API, set `A2ME_API_URL` and
`A2ME_USE_MOCK=false`. See [`.env.example`](./.env.example) for all options.

## Transports & auth

- **stdio** (default) — for local MCP clients.
- **http** (`MCP_TRANSPORT=http`) — remote MCP over HTTP, used by the hosted
  deployment. The HTTP transport is OAuth-gated via a swappable `TokenVerifier`
  (`dev` forwards the bearer unverified for local testing; `scalekit` validates
  the JWT against the issuer's JWKS).

## Conventions

- **Read-only only.** Tools may *read* family context; do not add write/delete
  capabilities. New tools must map to a read endpoint on the API's read-only
  allowlist (see `ROADMAP.md`).
- **Never commit secrets.** Use environment variables; `.env` is gitignored.
- TypeScript, with `npm run check`/`lint`/`format` clean before you push.

## Pull requests

- Branch from **`dev`** and open your PR against **`dev`** (the default branch);
  `main` is promoted from `dev`.
- Keep PRs focused; include tests for new tools or behavior changes.
- Describe what changed and why. Be kind in review. 🙂

## Reporting security issues

Please **don't** file public issues for vulnerabilities — see
[`SECURITY.md`](./SECURITY.md).
