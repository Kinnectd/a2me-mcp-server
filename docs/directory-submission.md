# Directory submission — Claude Connectors & ChatGPT App Directory

Goal: list `a2me-mcp-server` as an **official app/connector** in both Claude and
ChatGPT. The production server is live at `https://mcp.a2me.app/mcp` (Streamable
HTTP + Scalekit OAuth, `family:read`) and published to the official MCP registry
as `io.github.Kinnectd/a2me-mcp-server`. What remains is the per-platform
directory submission plus the readiness items below.

Status legend: ✅ done · ⏳ in progress / draft ready · 🔴 needs Byron (account or asset).

---

## Shared readiness (applies to both)

| Item                                                       | Status | Notes                                                                                                         |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| Remote server over HTTPS, Streamable HTTP                  | ✅     | `https://mcp.a2me.app/mcp`                                                                                    |
| OAuth 2.0 connect flow                                     | ✅     | Scalekit prod env, issuer `…scalekit.com/resources/res_133137420655641351`                                    |
| All tools carry `title` + `readOnlyHint` + `openWorldHint` | ✅     | Added this pass; verified via `tools/list`. Missing annotations are the #1 rejection cause on both platforms. |
| Read-only, privacy-redacted tools                          | ✅     | No email/phone/address; birthdays month–day only; family-scoped                                               |
| Graceful error handling (clear messaging)                  | ✅     | Tool failures return a friendly `isError` message, never a raw exception (both directories require this).     |
| Prompts (starting points)                                  | ✅     | 5 MCP prompts (birthday card, family message, catch-up, upcoming dates, about-person) → surface as commands.  |
| Privacy policy (hosted)                                    | ✅     | <https://a2me.app/privacy> · summarized in README                                                             |
| Support / contact channel                                  | ⏳     | Using `privacy@a2me.app` + SECURITY.md. Confirm a monitored support address/URL.                              |
| Tool result ≤ 25k tokens, handler ≤ 5 min (Claude limits)  | ✅     | Responses are small JSON; no long-running handlers                                                            |
| Published to MCP registry                                  | ✅     | See `reference-mcp-registry-publish`                                                                          |

### Listing copy (draft — reuse across both directories)

- **Name:** A2Me — Family Context
- **Short description (≤ ~30 chars for ChatGPT icon-name):** `A2Me`
- **One-liner:** Read-only family context from A2Me — birthdays, relationships,
  and memories to help you write cards and messages.
- **Long description:** A2Me is a family-first, privacy-first social platform.
  This connector lets your assistant answer questions about _your own_ family —
  "when is mom's birthday?", "who is Sarah to me?", "what's new with grandpa?" —
  and help you write birthday cards and thoughtful messages. It is strictly
  read-only and privacy-redacted: never any email, phone, address, or birth
  year, and everything is scoped to your family only.
- **Example prompts / use cases:**
  1. "When are the next family birthdays?"
  2. "Help me write a warm birthday card for my grandmother."
  3. "Who is Sarah to me, and what's she been up to lately?"
  4. "Draft a thank-you message to my uncle."
- **Category:** Lifestyle / Social / Productivity
- **Website:** <https://a2me.app/features/ai-integration>

### Data-handling answers (for the portals' data steps)

- Data accessed: read-only family-context (names, relationship labels,
  month–day dates, activity summaries), scoped to the authenticated user's family.
- Not accessed/returned: email, phone, physical address, birth year, financial/health.
- Retention: no family data at rest; append-only _access_ audit log only
  (timestamp, tool, calling assistant, scopes) surfaced to users under
  Settings → Connected apps.
- Third parties: OAuth via Scalekit; no family data shared beyond the connected assistant.
- Training: not used for model training.

---

## Claude — Connectors Directory

Docs: <https://claude.com/docs/connectors/building/submission> ·
FAQ: <https://support.claude.com/en/articles/11596036>

| Requirement                                                                                                                                | Status                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| 🔴 **Team or Enterprise Claude.ai org** (Owner submits via admin settings → submission portal). Individual/Pro plans cannot submit.        | 🔴 confirm/obtain                         |
| Streamable HTTP or SSE over HTTPS                                                                                                          | ✅                                        |
| OAuth 2.0                                                                                                                                  | ✅                                        |
| `title` + `readOnlyHint`/`destructiveHint` on every tool                                                                                   | ✅                                        |
| Privacy policy section in README + hosted URL                                                                                              | ✅                                        |
| Clear setup & usage docs                                                                                                                   | ✅ README                                 |
| Screenshots (3–5 PNG ≥1000px, cropped to app response) — **only if listing as an "MCP App" with UI**                                       | n/a for data-only connector               |
| Portal: 11 steps (Intro → Connection → Tools → Listing → Use Cases → Company → Auth → Data Handling → Test & Launch → Compliance → Review) | 🔴 Byron walks the portal with copy above |
| Accept 7 policy acknowledgments                                                                                                            | 🔴 at submission                          |

**Escalation/status:** submissions dashboard in Claude.ai; email `mcp-review@anthropic.com`.

---

## ChatGPT — App Directory (Apps SDK)

Docs: <https://developers.openai.com/apps-sdk/app-submission-guidelines>

| Requirement                                                                                                                                      | Status                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| 🔴 **Identity/business verification** in OpenAI Platform Dashboard under the exact publishing name (else auto-reject). Owner / `api.apps.write`. | 🔴 Byron                            |
| Functioning MCP server, low latency, graceful errors                                                                                             | ✅                                  |
| Correct tool annotations (`readOnlyHint`/`openWorldHint`) + justify each at submission                                                           | ✅                                  |
| Name (≤30 chars), short + long description                                                                                                       | ✅ draft above                      |
| Icon 64×64px, <5KB                                                                                                                               | ✅ `assets/app-icon-64.png` (852 B) |
| Interactive UI (Apps SDK widgets)                                                                                                                | ✅ 2 widgets built (see below)      |
| Screenshots reflecting real behavior                                                                                                             | 🔴 capture from live connect        |
| Verified website                                                                                                                                 | ✅ a2me.app/features/ai-integration |
| Privacy policy                                                                                                                                   | ✅ a2me.app/privacy                 |
| Commerce restriction (physical goods only; no digital subscriptions in-app)                                                                      | ✅ n/a — connector sells nothing    |
| Only one version under review at a time                                                                                                          | —                                   |

**Scope decision (DECIDED — Byron, go full Apps SDK):** ship interactive inline UI
components, not data-only. Built two React widgets rendered inside ChatGPT:
`get_upcoming_family_dates` → **Upcoming family dates** card, `get_family_members` →
**Your family** roster. Each is served as a `ui://widget/*.html` resource
(`text/html+skybridge`) with the tool carrying `openai/outputTemplate`; the widget reads
the tool's `structuredContent` from `window.openai.toolOutput`. Source in `widgets/src/`,
architecture in the README. These make the listing visual and give us branded artifacts
for social posts. Add more widgets later (person profile, activity feed) as desired.

---

## Open items needing Byron

1. 🔴 **Claude org tier** — create a Team/Enterprise Claude org to unlock the submission portal (walkthrough §A).
2. 🔴 **OpenAI identity verification** — complete under the publishing name in the Platform Dashboard (walkthrough §B).
3. ✅ **Icon** — `assets/app-icon-64.png` (64px, 852 B) + `app-icon-512.png`.
4. ✅ **ChatGPT UI scope** — decided: full Apps SDK widgets (built).
5. 🔴 **Deploy widgets to prod** — merge this branch → dev (auto-deploys), verify widgets render in ChatGPT against dev, then promote dev → main so `mcp.a2me.app` serves them before submitting.
6. 🔴 **Screenshots** — co-create: connect the prod (or dev) server in ChatGPT/Claude from a **family-having** account and capture 3–5 real responses (widgets + example prompts). `byron.walker@kinnectd.com` has no family on dev; use a populated account.
7. 🔴 **Support contact** — confirm a monitored support email/URL for the listings.

See [`submission-walkthrough.md`](submission-walkthrough.md) for Byron's step-by-step.
