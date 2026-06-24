# Security Policy

The A2Me MCP Server brokers **read-only** access to A2Me users' family data on
their behalf, gated by OAuth. We take its security seriously and appreciate
responsible disclosure.

## Reporting a vulnerability

**Please do not open a public issue for security problems.**

- Preferred: use GitHub's **private vulnerability reporting** — the
  **"Report a vulnerability"** button under this repository's **Security** tab.
- Or email **security@kinnectd.com** (and **support@kinnectd.com** as a
  fallback).

Please include enough detail to reproduce (affected endpoint/tool, steps,
impact, and any proof-of-concept). We aim to acknowledge within a few business
days and will keep you updated on remediation.

## Scope

In scope:

- The MCP server in this repository (auth/token verification, the tool
  handlers, and how it calls the A2Me API on the user's behalf).
- The remote deployment at `https://mcp.a2me.app`.

Out of scope (report to the relevant project/provider instead):

- The A2Me web/mobile apps and the core `kinnectd-api`.
- Scalekit (our OAuth authorization server) and other third-party providers.

## Design notes relevant to security

- **Read-only.** The exposed tools only *read* family context; the server has
  no write/delete tools.
- **OAuth-gated.** Remote (HTTP) access requires a valid bearer token; the
  server validates it (issuer/JWKS/audience) before any tool runs, and calls
  the A2Me API as the authenticated user — never with elevated privileges.
- **No secrets in the repo.** Credentials are supplied via environment
  variables / the platform's secret store, never committed. See `.env.example`.
