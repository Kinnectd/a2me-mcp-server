import type { Request, Response } from 'express';

/**
 * Human/LLM-facing front door for mcp.a2me.app.
 *
 * The MCP endpoint itself is a POST-only JSON-RPC transport, so anyone (or any
 * crawler) visiting the domain root used to get a bare 404 and learn nothing.
 * These handlers give the root a small self-describing landing page and an
 * llms.txt, so both people and AI assistants can discover what this server is
 * and how to connect — without touching the protocol surface.
 */

const FEATURE_PAGE = 'https://a2me.app/features/ai-integration';
const MCP_URL = 'https://mcp.a2me.app/mcp';

const LANDING_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>A2Me MCP Server</title>
  <meta name="description" content="Remote MCP server for A2Me, the private family-first social platform. Connect Claude, ChatGPT, or any MCP-compatible assistant for OAuth-secured, read-only access to your family information." />
  <link rel="canonical" href="https://mcp.a2me.app/" />
  <style>
    body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1.25rem; line-height: 1.6; color: #1a2b1a; }
    h1 { font-size: 1.6rem; }
    code { background: #f0f5ec; padding: 0.15rem 0.4rem; border-radius: 4px; }
    a { color: #4a8b2c; }
  </style>
</head>
<body>
  <h1>A2Me MCP Server</h1>
  <p>
    This is the remote <a href="https://modelcontextprotocol.io">Model Context Protocol</a>
    server for <a href="https://a2me.app">A2Me</a>, the private, family-first social platform.
    It gives MCP-compatible AI assistants (Claude, ChatGPT, and others) OAuth-secured,
    read-only access to your family information on A2Me.
  </p>
  <p>
    <strong>Connector URL:</strong> <code>${MCP_URL}</code> (Streamable HTTP, OAuth 2.0)
  </p>
  <p>
    Setup instructions live at
    <a href="${FEATURE_PAGE}">a2me.app/features/ai-integration</a>. OAuth discovery
    metadata is served at
    <a href="/.well-known/oauth-protected-resource">/.well-known/oauth-protected-resource</a>.
  </p>
  <h2>What your assistant can do</h2>
  <p>Sixteen read-only tools, always scoped to your own family and what you're allowed to see:</p>
  <ul>
    <li><strong>Family</strong> — members, profiles, how two people are related, find someone by name</li>
    <li><strong>Dates</strong> — upcoming birthdays &amp; anniversaries, birthday-card context, date questions ("when is Mom's birthday?")</li>
    <li><strong>Events &amp; trips</strong> — what's coming up, RSVP status, trip rosters, flights &amp; lodging ("when does Marcia land?"), itineraries</li>
    <li><strong>Life stories</strong> — a family member's biography chapters, and the questions nobody has answered yet ("what should I ask Grandpa when I visit?")</li>
    <li><strong>Memories</strong> — recent family activity, keyword search over posts ("find the post about the lake trip"), a catch-up summary ("what did I miss?")</li>
    <li><strong>Gifts</strong> — wishlists for birthday and holiday planning</li>
  </ul>
  <p>
    Not on A2Me yet? <a href="https://a2me.app">Learn more and join</a> — it's free.
  </p>
</body>
</html>
`;

const LLMS_TXT = `# A2Me MCP Server

> Remote MCP (Model Context Protocol) server for A2Me (https://a2me.app), the
> private, family-first social platform by Kinnectd. OAuth-secured, read-only.

## Connecting

- Connector URL: ${MCP_URL} (Streamable HTTP transport, OAuth 2.0)
- Setup guide: ${FEATURE_PAGE}
- OAuth discovery: https://mcp.a2me.app/.well-known/oauth-protected-resource
- Registry entry: io.github.Kinnectd/a2me-mcp-server (official MCP registry)

## Tools (read-only, scoped to the authenticated user's own family and visibility)

Keep in sync with src/server.ts registrations.

- get_family_members — the user's family with relationship labels
- find_family_member — fuzzy person lookup by name or relationship ("my sister")
- get_person_profile — one member's profile (privacy-redacted)
- get_relationship_between_people — how two family members are related
- get_recent_family_activity — recent family activity: posts, photos, videos, birthday cards, events
- get_message_context_for_person — context for writing a message to someone: interests, relationship, occasion-appropriate suggestions
- get_upcoming_family_dates — upcoming birthdays, anniversaries, and family events (month-day only)
- get_birthday_card_context — context for writing someone's birthday card
- answer_family_date_question — direct answers like "when is Mom's birthday?"
- get_upcoming_events — events the user is hosting or invited to, with RSVP status
- get_trip_overview — a trip's roster, flights, lodging, and itinerary ("when does Marcia land?")
- get_life_story — a member's biography chapters, built from family memories (toasts, speeches, history)
- get_unanswered_story_questions — unanswered story questions about a person (interview prep)
- get_person_wishlist — a member's wishlist for gift planning
- search_family_memories — keyword search over recent family posts
- whats_new — catch-up summary: recent posts plus what's coming up

## Example questions to ask a connected assistant

- "When does everyone land for the reunion, and who still hasn't RSVP'd?"
- "What should I ask Grandpa about his life when I visit this weekend?"
- "Help me write a toast for Mom's birthday using our family stories."
- "What's on Mike's wishlist? Suggest a gift under $50."
- "Catch me up — what did I miss this week?"

## About A2Me

- Product overview for LLMs: https://a2me.app/llms.txt
- Features directory: https://a2me.app/features
`;

export function landingHandler(_req: Request, res: Response): void {
  res.type('html').send(LANDING_HTML);
}

export function llmsTxtHandler(_req: Request, res: Response): void {
  res.type('text/plain').send(LLMS_TXT);
}
