# a2me-mcp-server — Copilot / Agent Instructions

## Overview

`a2me-mcp-server` is a **Model Context Protocol (MCP) server** that exposes **read-only,
privacy-redacted family-context tools** to LLM assistants (Claude, ChatGPT, and the in-product
KAI assistant). It lets an assistant answer questions like "when is mom's birthday?" or "help me
write a message to grandma" using A2Me family data — without exposing sensitive details.

**Status: experimental / spike.** Auth and the A2Me API are currently **mocked**; the intended
future state is real OAuth/Firebase auth + live A2Me API calls.

## Stack

- **Node 20+**, **TypeScript** (strict). MCP via `@modelcontextprotocol/sdk`, **stdio** transport.
- **Zod** for input validation, **Vitest** for tests, ESLint + Prettier.

## Commands

```bash
npm install
npm run dev          # tsx src/index.ts (run locally over stdio)
npm run build        # tsc -> dist/
npm run start        # node dist/index.js
npm run test         # vitest run   (test:watch for watch mode)
npm run check        # tsc --noEmit (type check)
npm run lint         # eslint src/ test/
npm run format       # prettier --write .
```

## Layout

`src/` → `index.ts` (entry), `server.ts`, `tools/` (the MCP tools), `auth/`, `client/`,
`resolver/`, `mock/` (mock auth + API), `config.ts`, `types/`.

## Conventions (CRITICAL — privacy)

- Tools are **read-only**; never mutate A2Me data from here.
- **Redact sensitive fields:** no raw email / phone / street address; birthdays as month–day
  only. Scope every result to the **authenticated user's family** — never leak other families'
  data. (This matches A2Me's child-safety / privacy-first positioning.)
- Validate all tool inputs with **Zod**.
- Keep `mock/` behind the same interfaces as the real client so swapping in the live API later
  is a drop-in change.

## Repo conventions

- This repo uses **`main`** as its default branch (no dev/prod env split yet). Target PRs at
  `main` unless told otherwise.
- Any future credentials must come from env/secret stores — never commit tokens.
