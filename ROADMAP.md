# a2me-mcp-server — Roadmap to production

> Goal: let an a2me user connect their account to **Claude / ChatGPT** once and use a2me from
> inside the assistant. End-state direction (decided): **hosted remote MCP server with an OAuth
> "Connect a2me" flow**, **read-only** for v1 (write actions follow in a later phase).

This server starts as a spike with mocked auth + mocked data. The plan below turns it real in
reviewable increments. `config.useMock` (default `true`) keeps the spike runnable offline; flip
`A2ME_USE_MOCK=false` to exercise the live integration as methods get wired.

## Tool → real kinnectd-api endpoint map

Base path is `/api` (the servlet context). All calls send `Authorization: Bearer <token>` and are
scoped server-side to the caller's family — we never pass another user's id to fetch their data.

| Tool / client method                                                         | Real endpoint                                                          | Notes                                                                                                                           |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `getFamilyMembers` ✅ wired                                                  | `GET /me/v2/family?includeLabels=true`                                 | `GetFamilyResponseDTO { members:[{ user:UserDTO, up, down, neutralLabel, genderedLabel }] }`. Birthday rendered month-day only. |
| `getUpcomingDates`                                                           | family birthdays (above) + `GET /events?timing=UPCOMING&page=0&size=…` | `Page<EventDTO>`; merge with derived birthdays.                                                                                 |
| `getRecentActivity`                                                          | `GET /posts/feed?page=0&size=N`                                        | `Page<PostDTO>`; filter by `createdAt` client-side.                                                                             |
| `getPersonProfile`                                                           | family member (above) + `GET /posts/users/{userId}`                    | Compose; redact contact info.                                                                                                   |
| `getRelationshipBetween`                                                     | derive from the labeled family list                                    | `up`/`down` + `neutralLabel` already encode the relationship — no extra call.                                                   |
| `getBirthdayCardContext`                                                     | `getPersonProfile` + recent activity for that person                   | Pure composition.                                                                                                               |
| `findFamilyMember`, `answerFamilyDateQuestion`, `getMessageContextForPerson` | resolvers over the above                                               | No new endpoints.                                                                                                               |

Most tools are resolvers over **three primitives**: family list, upcoming events, recent feed.
Wiring those three real lights up nearly everything.

## Phases

**Phase 0 — Real read-only data (in progress).** Replace the mock client method-by-method with the
endpoints above; transform DTOs → MCP types; keep `useMock` fallback + tests green. Validate
against the dev API with a real bearer token. _Auth-agnostic — works with any valid token, so none
of this is wasted regardless of the auth decision._

**Phase 1 — Remote transport + hosting.** Add the MCP **Streamable HTTP** transport alongside
stdio; containerize (Dockerfile exists) and deploy to **Cloud Run (dev)**. Still bearer-protected
(same `Authorization: Bearer` path). This makes the server reachable by a remote MCP client.

**Phase 2 — OAuth "Connect a2me" (the end-state unlock).** Implement the MCP OAuth flow so
Claude/ChatGPT can do a one-click connect:

- MCP server advertises `/.well-known/oauth-protected-resource` (+ authorization-server metadata).
- An a2me **authorization server** authenticates the user (via Firebase login) and issues a
  scoped, refreshable access token; the MCP server validates it.
- Ideally support Dynamic Client Registration so any MCP client can register.

**Phase 3 — Trust & control.** "Connected apps" settings UI (list + revoke), per-token scopes,
rate limiting, and audit logging of MCP access (reuse the AdminActivityLog pattern).

**Phase 4 (later) — Write actions.** Add tools to post, RSVP, and send messages — only after the
auth model is locked down (posting on someone's behalf needs the scoping + moderation story).

## Open design decisions (need Byron) before Phase 2

1. **Where does the OAuth authorization server live?** Spring Authorization Server inside
   kinnectd-api, a small standalone auth service, or a managed provider (e.g. Auth0/Firebase as
   the IdP behind our own AS)? Trade-off: build/control vs. vendor/speed.
2. **Token format & lifetime** — opaque + introspection vs. signed JWT the MCP server validates
   offline; access-token TTL + refresh policy.
3. **Scopes** — start with a single read-only `family:read` scope; expand for Phase 4 writes.
4. **Distribution** — list in the Claude/ChatGPT MCP directories, or share a connect URL?

## Status

- ✅ Decisions recorded (hosted remote + OAuth; read-only v1).
- ✅ `getFamilyMembers` wired to the real `/me/v2/family` shape (behind `useMock`).
- ⏳ Phase 0: wire upcoming-dates, recent-activity, person-profile.
- ⏳ Phase 1+: transport, hosting, OAuth.
