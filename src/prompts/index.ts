import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import { z } from 'zod';
import { completePersonReference } from '../completions.js';

/**
 * A "who" prompt argument that autocompletes from the caller's family roster
 * (names + relationship labels) as they type. MCP argument completion is supported for
 * prompt arguments (`ref/prompt`), so this is where it belongs.
 */
function personArg(describe: string) {
  return completable(z.string().describe(describe), completePersonReference);
}

/**
 * MCP prompts — one-click starting points that surface in the assistant's UI
 * (Claude shows them as connector commands; ChatGPT can offer them as suggestions).
 * Each prompt is a short, ready-to-run instruction that steers the assistant to use
 * this server's read-only tools, so users get value without knowing the tool names.
 * Read-only and privacy-safe by construction — they only ask the model to call the
 * same redacted tools.
 */

function userText(text: string) {
  return { messages: [{ role: 'user' as const, content: { type: 'text' as const, text } }] };
}

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    'write_birthday_card',
    {
      title: 'Write a birthday card',
      description: 'Draft a heartfelt birthday card for a family member, grounded in A2Me context.',
      argsSchema: {
        person: personArg(
          'Who the card is for — a name or relationship (e.g. "my sister", "Grandma Ruth")',
        ),
      },
    },
    ({ person }) =>
      userText(
        `Help me write a heartfelt birthday card for ${person}. ` +
          `First, use the A2Me tools to ground it: find_family_member to resolve who they are, then ` +
          `get_birthday_card_context for their interests, shared memories, and tone suggestions. ` +
          `Then draft 2–3 options in different tones (warm, playful, sincere). Keep each short enough ` +
          `to fit on a card.`,
      ),
  );

  server.registerPrompt(
    'write_family_message',
    {
      title: 'Write a message to family',
      description: 'Draft a thoughtful message to a family member for any occasion.',
      argsSchema: {
        person: personArg('Who the message is for — a name or relationship'),
        occasion: z
          .string()
          .optional()
          .describe('Occasion, e.g. "thank you", "checking in", "congratulations"'),
        tone: z.string().optional().describe('Desired tone, e.g. "warm", "funny", "formal"'),
      },
    },
    ({ person, occasion, tone }) =>
      userText(
        `Help me write a message to ${person}` +
          (occasion ? ` for this occasion: ${occasion}` : '') +
          (tone ? `, in a ${tone} tone` : '') +
          `. Use the A2Me get_message_context_for_person tool first to ground it in our relationship ` +
          `and their interests, then draft the message. Offer a short and a longer version.`,
      ),
  );

  server.registerPrompt(
    'family_catch_up',
    {
      title: 'Catch me up on my family',
      description: "Summarize what's new with your family lately.",
    },
    () =>
      userText(
        `Catch me up on what's been happening with my family lately. Use the A2Me ` +
          `get_recent_family_activity tool, then give me a warm, brief summary grouped by person, ` +
          `and point out anything I might want to respond to or celebrate.`,
      ),
  );

  server.registerPrompt(
    'upcoming_family_dates',
    {
      title: 'Upcoming family dates',
      description: 'See upcoming birthdays, anniversaries, and events, with suggestions.',
      argsSchema: {
        days: z.string().optional().describe('How many days ahead to look (default 30)'),
      },
    },
    ({ days }) =>
      userText(
        `Show me the upcoming birthdays, anniversaries, and family events` +
          (days ? ` in the next ${days} days` : ` in the next 30 days`) +
          `. Use the A2Me get_upcoming_family_dates tool, then list them soonest-first and flag ` +
          `anyone I should prepare a card or gift for.`,
      ),
  );

  server.registerPrompt(
    'about_person',
    {
      title: 'Tell me about a family member',
      description: "Get a warm summary of a family member and how you're related.",
      argsSchema: {
        person: personArg('Who to look up — a name or relationship'),
      },
    },
    ({ person }) =>
      userText(
        `Tell me about ${person}. Use the A2Me tools (find_family_member, get_person_profile) to ` +
          `resolve who they are and summarize their interests, how we're related, and what they've ` +
          `been up to recently — warmly and briefly.`,
      ),
  );
}
