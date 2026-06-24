# MCP usage tracking — design proposal

Goal (Byron, 2026-06-23): capture MCP ("Connect a2me") usage and surface it two ways —

1. **Admin console** — simple counts _and_ detailed data (which user, when, which tool, which client).
2. **User-facing** — so a user can see their account was accessed via the MCP server, ideally with
   "via Claude" detail.

This is a proposal with a recommended path + the decisions that are yours. Nothing here is built
yet — it spans `kinnectd-db` (migration), `kinnectd-core` (entity/DTO), `kinnectd-api` (capture +
read endpoints), `kinnectd-admin-console` (display), and the web/mobile apps (user-facing surface).

---

## Where usage is observable (the capture point)

`McpTokenAuthenticationFilter` (kinnectd-api) runs on **every** MCP request and already knows:

- the **user** (resolved a2me user) — `McpAuthenticationToken.user`,
- the **endpoint/path** (`/me/v2/family`, `/posts/feed`, …),
- the HTTP method, timestamp, request IP / `User-Agent`,
- the token **scopes**.

So the filter (on successful auth) is the natural single capture point — every MCP-served request
flows through it, and nothing else needs to change per-endpoint.

> **The path does NOT identify the tool.** Several MCP tools resolve over the same few kinnectd-api
> endpoints (e.g. `find_family_member`, `get_message_context_for_person`, and `get_person_profile`
> all read `/me/v2/family`), some tools make **multiple** calls, and some make **none**. So the
> **tool name must be forwarded explicitly by the MCP server** (see below), not inferred from the
> URL — otherwise per-tool attribution is wrong and a couple of tools never appear at all.

### Getting the "via Claude" and per-tool detail

The Scalekit access token says nothing about the client or the tool. Both are known on the
**a2me-mcp-server** side, so the server should **forward them as request headers** on each
kinnectd-api call (and the api records them):

- **`X-MCP-Client`** — the calling assistant, from the MCP `initialize` `clientInfo { name, version }`
  (e.g. `claude-ai/1.x`); fall back to `User-Agent`. Captured at `initialize` and stashed in the
  per-request `requestContext` next to `a2meToken`. This is the "via Claude" detail.
- **`X-MCP-Tool`** — the tool being executed (e.g. `get_family_members`), set by the server in the
  tool-dispatch path. This is the **only reliable** tool identifier (vs. inferring from the path).

> **Treat both as untrusted, client-controlled strings.** `clientInfo`/`User-Agent` come from the
> client. Before persisting/displaying: **cap length** (e.g. 100 chars), **allowlist characters**
> (strip control chars / HTML), and **never store the raw `User-Agent`** verbatim — to avoid log and
> stored-XSS injection in the admin/user UIs. `X-MCP-Tool` should be validated against the known
> tool-name set and dropped if unrecognized.

---

## Data model — recommended

A dedicated, append-only access log — small, query-friendly, and decoupled from the existing
`UserSession` (which models login sessions, not per-call API access):

`mcp_access_log` (kinnectd-db migration + `kinnectd-core` entity `McpAccessLog`):

| column                        | notes                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id` (uuid, pk)               |                                                                                                                                                           |
| `user_id` (uuid, fk users)    | the accessed account                                                                                                                                      |
| `occurred_at` (timestamptz)   |                                                                                                                                                           |
| `endpoint` (text)             | request path, e.g. `/me/v2/family`                                                                                                                        |
| `tool` (text, null)           | the MCP tool name, from `X-MCP-Tool` (forwarded by the server — **not** inferred from the path; tools share endpoints). Null if a future caller omits it. |
| `method` (text)               | always GET in read-only v1                                                                                                                                |
| `client_name` (text, null)    | from `X-MCP-Client`, normalized (length-capped, char-allowlisted) — e.g. `claude-ai`                                                                      |
| `client_version` (text, null) | normalized                                                                                                                                                |
| `ip` (inet/text, null)        |                                                                                                                                                           |
| `scopes` (text, null)         | e.g. `family:read`                                                                                                                                        |
| `status` (int, null)          | response status — only if captured post-handler (see below), not from the auth filter                                                                     |

Indexes: `(user_id, occurred_at desc)`, `(occurred_at)`, `(tool)`.

> Why a dedicated log, not extending `UserSession`: MCP access is _per-call_, high-cardinality, and
> append-only; sessions are coarse login records. We can still derive a "connected app" summary for
> the user-facing view by aggregating this log (latest access per client).

---

## Capture mechanics (don't slow the request)

Write **asynchronously** so the filter never adds DB latency to a user's tool call:

- On successful MCP auth, publish a lightweight Spring `ApplicationEvent`
  (`McpAccessEvent(userId, endpoint, tool, client, ip, scopes, occurredAt)`), reading `tool`/`client`
  from the forwarded `X-MCP-Tool` / `X-MCP-Client` headers (normalized).
- An `@Async`/`@EventListener` (or a tiny service on the existing async executor) persists it.
- MCP traffic is low-volume, so a direct async insert is fine for v1 (no Cloud Task needed).

Because the tool name is forwarded by the server, the api records it directly — there's **no
path→tool map to maintain** in the filter (which would otherwise duplicate, and drift from, the
server's tool list).

> **On `status`:** the auth filter runs _before_ the handler, so the response status isn't known
> there. If status is wanted, capture it post-handler (a small response-wrapping filter / interceptor
> on the MCP paths) rather than in the auth filter. It's optional for v1 — the access record is
> already useful without it.

---

## Admin console

Read endpoints in kinnectd-api (admin-guarded, mirroring existing admin/analytics patterns):

- **Counts:** total requests, unique users, requests-by-tool, requests-by-day (date-bucketed),
  active connected clients. (`GET /admin/mcp/usage/summary?from&to`)
- **Detail:** paged log — user, when, tool, client, ip. (`GET /admin/mcp/usage?user&tool&from&to&page`)

Admin-console UI: a "MCP usage" page — top cards (totals/unique users/by tool), a by-day chart, and
a filterable detail table. Reuse the console's existing table/chart components.

---

## User-facing ("your account was accessed via Claude")

Surface per-user MCP access in the user's **security / connected-access** area. Two cohesive options:

- **Fold into existing Sessions/Security UI** (if there's an "active sessions / recent activity"
  screen) as entries like _"Accessed via Claude (MCP) — Jun 23, 2:14pm"_.
- **A dedicated "Connected apps" screen** (aligns with the roadmap's P3 "Connected apps settings +
  revoke + scopes"): list each connected client (Claude/ChatGPT), last access, what it can read
  (`family:read`), and a future **Revoke** action.

Read endpoint: `GET /me/mcp-access?page` (the user's own log) and/or `GET /me/connected-apps`
(aggregated latest-per-client). Privacy: a user only ever sees their **own** access.

---

## Recommended phasing

- **Phase A — Capture:** db migration + core `McpAccessLog` + async capture in the filter +
  a2me-mcp-server forwards `X-MCP-Client` and `X-MCP-Tool` (normalized on the api side). (Foundation;
  nothing visible yet.)
- **Phase B — Admin:** summary + detail read endpoints + admin-console "MCP usage" page.
- **Phase C — User-facing:** `/me` read endpoint + surface in security/connected-apps (web first,
  then mobile), wired toward future revoke.

---

## Decisions for Byron

1. **Granularity** — log **every tool call** (recommended; richest, supports counts + detail) vs.
   coarser session/day rollups. Per-call is more data but MCP volume is low.
2. **User-facing home** — fold into an existing Sessions/Security screen, or a new **Connected apps**
   screen (ties to revoke later)? (Recommend Connected apps — it's where revoke will live.)
3. **Retention** — how long to keep detailed rows (e.g. 90/180 days) before aggregating/pruning?
4. **Client detail depth** — just the client name ("Claude"), or also version + IP + approximate
   location? (More detail = more value, slightly more sensitive.)
5. **Scope of "access" shown to users** — every call, or a daily "accessed via Claude N times"
   summary (less noisy for users)?
6. **Revoke** — in scope now, or capture-and-display first and add revoke with the OAuth
   "Connected apps" work later? (Recommend later; revoke needs token/grant invalidation via Scalekit.)

Once you pick on 1–2 and 6, Phase A is a small, well-scoped PR set.
