# A2Me MCP Server

> **v1 · read-only.** A [Model Context Protocol](https://modelcontextprotocol.io) server that exposes **read-only, privacy-redacted** family-context tools for the [A2Me](https://a2me.app) family social platform — so assistants like Claude, ChatGPT, or KAI can answer "when is mom's birthday?" or help write a message to grandma, scoped to your own family.

Hosted at **`https://mcp.a2me.app/mcp`** and used in production for A2Me's [Connect a2me](https://a2me.app/features/ai-integration) feature.

## Connect from an AI assistant

In Claude or ChatGPT, add a **custom connector** using the URL:

```
https://mcp.a2me.app/mcp
```

You'll be sent through OAuth to sign in to A2Me and grant **read-only** access; the assistant then has family-aware context scoped to your account.

## Run it locally

```bash
npm install
npm run dev        # stdio transport, mock data by default
```

It runs on **stdio** by default (for local MCP clients) and supports a remote **HTTP** transport (`MCP_TRANSPORT=http`) for the hosted deployment. By default it uses **mock data** (`A2ME_USE_MOCK=true`); set `A2ME_API_URL` + `A2ME_USE_MOCK=false` to call a real API. See [`.env.example`](./.env.example).

## Available Tools

| Tool                              | Description                                                     |
| --------------------------------- | --------------------------------------------------------------- |
| `get_family_members`              | Returns the user's family members with relationship labels      |
| `get_upcoming_family_dates`       | Birthdays, anniversaries, and events in the next N days         |
| `get_recent_family_activity`      | Recent posts, photos, videos, birthday cards                    |
| `get_person_profile`              | A family member's profile, interests, and activity summary      |
| `get_relationship_between_people` | How two family members are related                              |
| `get_birthday_card_context`       | Context for writing a birthday card (memories, interests, tone) |
| `find_family_member`              | Fuzzy search by name or relationship ("mom", "my grandmother")  |
| `answer_family_date_question`     | Natural language date questions ("When is mom's birthday?")     |
| `get_message_context_for_person`  | Context for writing a message with suggestions                  |

## Prompts

The server also exposes **prompts** — one-click starting points that appear as
connector commands in Claude (and suggestions in ChatGPT), so users get value without
knowing tool names. Each steers the assistant to the read-only tools above:

| Prompt                  | What it does                                           |
| ----------------------- | ------------------------------------------------------ |
| `write_birthday_card`   | Draft a birthday card grounded in a person's context   |
| `write_family_message`  | Draft a message for any occasion/tone                  |
| `family_catch_up`       | Summarize what's new with the family                   |
| `upcoming_family_dates` | List upcoming birthdays/anniversaries with suggestions |
| `about_person`          | Warm summary of a family member and how you're related |

The `person` argument on these prompts **autocompletes from your family roster**
(names + relationship labels) as you type — MCP argument completion, scoped to your
family. See [`src/prompts/index.ts`](src/prompts/index.ts) and
[`src/completions.ts`](src/completions.ts).

## Example Scenarios

1. **"Help me write a birthday card for my sister"**
   - `find_family_member` → resolves "my sister" to Sarah Walker
   - `get_birthday_card_context` → returns interests (painting, hiking, coffee), tone suggestions

2. **"When is grandma's birthday?"**
   - `answer_family_date_question` → returns Margaret Walker's birthday (November 8)

3. **"What's been happening in the family?"**
   - `get_recent_family_activity` → returns recent posts, photos, events

4. **"Help me write a thank you message to my dad"**
   - `get_message_context_for_person` → returns Robert Walker's context, interests, suggestions

5. **"Who's in my family?"**
   - `get_family_members` → returns all family members with relationships

6. **"What events are coming up?"**
   - `get_upcoming_family_dates` → returns upcoming birthdays, anniversaries, events

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client (LLM)                       │
│              (Claude, ChatGPT, KAI, etc.)                │
└───────────────────────┬─────────────────────────────────┘
                        │ stdio (MCP Protocol)
┌───────────────────────▼─────────────────────────────────┐
│                  A2Me MCP Server                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Tool Registry (9 tools)              │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │         Family Context Resolver                   │    │
│  │   (fuzzy matching, relationship resolution)       │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │            A2Me API Client                        │    │
│  │   (currently mock, future: real HTTP calls)       │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────┐    │
│  │            Auth Context                           │    │
│  │   (currently mock, future: OAuth/Firebase)        │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                        │ (future)
┌───────────────────────▼─────────────────────────────────┐
│                   A2Me REST API                           │
│               (kinnectd-api service)                     │
└─────────────────────────────────────────────────────────┘
```

## Authentication

Currently uses **mock authentication** — always returns an authenticated user ("Alex Walker") for local development.

**Future production integration:**

- OAuth2/Firebase token validation via A2Me API
- Token passed via MCP session context or environment
- Per-user data isolation (users only see their own family)

## Required A2Me API Endpoints (Future)

| Method | Endpoint                             | Description                          |
| ------ | ------------------------------------ | ------------------------------------ |
| GET    | `/family/members`                    | List user's family members           |
| GET    | `/family/dates/upcoming`             | Upcoming dates with filters          |
| GET    | `/family/activity/recent`            | Recent family activity feed          |
| GET    | `/people/{personId}/context`         | Person profile with safe context     |
| GET    | `/relationships/path`                | Relationship path between two people |
| GET    | `/birthday-cards/context/{personId}` | Birthday card writing context        |

## ChatGPT app widgets

For ChatGPT (Apps SDK), four tools render an interactive inline widget instead of
plain JSON:

- `get_upcoming_family_dates` → an **Upcoming family dates** card
- `get_family_members` → a **Your family** roster
- `get_person_profile` → a **Family member** profile card
- `get_recent_family_activity` → a **Recent family activity** feed

Each widget is a small React bundle in [`widgets/src/`](widgets/src) built by
`npm run build:widgets` into `dist-widgets/<name>.js|.css`. The server serves those as
static assets (`/widgets/...`) and exposes each as a `ui://widget/<name>.html`
resource (MIME `text/html+skybridge`); the paired tool carries
`_meta["openai/outputTemplate"]` pointing at it. The widget reads the tool's
`structuredContent` from `window.openai.toolOutput` and renders it. Other MCP clients
(Claude, KAI) ignore the widgets and use the same tools' text output. See
[`src/widgets/registry.ts`](src/widgets/registry.ts).

## Development

```bash
npm run dev            # Run the server with tsx (hot reload)
npm run build          # Compile server (tsc) + build widget bundles
npm run build:server   # Server only
npm run build:widgets  # Widget bundles only (-> dist-widgets/)
npm run test           # Run tests (incl. widget render tests)
npm run test:watch     # Watch mode
npm run lint           # ESLint
npm run format         # Prettier
npm run check          # Type check only
```

## Privacy Design

This server is designed to be **privacy-first**:

- No email addresses, phone numbers, or physical addresses are ever returned
- Birthdays are shown as month-day only (no birth year)
- No financial or health information
- All data scoped to the authenticated user's family only
- Managed accounts (children) have additional protections

## Privacy Policy

**Privacy policy:** <https://a2me.app/privacy>

This connector accesses A2Me data on behalf of the authenticated user, over an
OAuth 2.0 "Connect A2Me" flow, and is bound by the A2Me privacy policy above.

- **What we collect / access:** read-only family-context data for the
  authenticated user's own family — member names, relationship labels,
  month–day of birthdays and events, and recent activity summaries. We never
  return email addresses, phone numbers, physical addresses, birth years,
  or financial/health data.
- **How it's used:** returned to the connected AI assistant solely to answer
  the user's request in-session. The connector does not train models on this
  data and performs no writes back to A2Me.
- **Storage & retention:** the connector holds no family data at rest. For
  transparency and abuse prevention we log access metadata (timestamp,
  tool name, calling assistant, scopes) in an append-only audit log; users can
  review this under **Settings → Connected apps** in A2Me.
- **Third-party sharing:** OAuth tokens are issued and validated via our auth
  provider (Scalekit); no family data is shared with third parties beyond the
  AI assistant the user explicitly connected.
- **Contact:** privacy@a2me.app · security disclosures per [SECURITY.md](SECURITY.md).

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Validation:** Zod
- **Testing:** Vitest
- **Transport:** Streamable HTTP (remote/production) and stdio (local dev)

## License

Private — Kinnectd / A2Me
