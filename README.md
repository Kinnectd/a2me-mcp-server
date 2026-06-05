# A2Me MCP Server

> ⚠️ **EXPERIMENTAL** — This is a research/spike project. Not production ready. Do not deploy to production environments.

A Model Context Protocol (MCP) server that exposes read-only family context tools for the A2Me family social platform. Designed to be consumed by LLM-powered assistants (like Claude, ChatGPT, or KAI) to provide family-aware, privacy-conscious context.

## Quick Start

```bash
npm install
npm run dev
```

The server runs on **stdio transport** (standard for MCP servers).

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

## Development

```bash
npm run dev        # Run with tsx (hot reload)
npm run build      # Compile TypeScript
npm run test       # Run tests
npm run test:watch # Watch mode
npm run lint       # ESLint
npm run format     # Prettier
npm run check      # Type check only
```

## Privacy Design

This server is designed to be **privacy-first**:

- No email addresses, phone numbers, or physical addresses are ever returned
- Birthdays are shown as month-day only (no birth year)
- No financial or health information
- All data scoped to the authenticated user's family only
- Managed accounts (children) have additional protections

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Validation:** Zod
- **Testing:** Vitest
- **Transport:** stdio (standard MCP transport)

## License

Private — Kinnectd / A2Me
