import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { config } from './config.js';

import { getFamilyMembers } from './tools/get-family-members.js';
import { getUpcomingFamilyDates } from './tools/get-upcoming-family-dates.js';
import { getRecentFamilyActivity } from './tools/get-recent-family-activity.js';
import { getPersonProfile } from './tools/get-person-profile.js';
import { getRelationshipBetweenPeople } from './tools/get-relationship-between-people.js';
import { getBirthdayCardContext } from './tools/get-birthday-card-context.js';
import { findFamilyMember } from './tools/find-family-member.js';
import { answerFamilyDateQuestion } from './tools/answer-family-date-question.js';
import { getMessageContextForPerson } from './tools/get-message-context-for-person.js';
import {
  WIDGETS,
  widgetForTool,
  widgetHtml,
  widgetToolMeta,
  WIDGET_MIME_TYPE,
} from './widgets/registry.js';
import { registerPrompts } from './prompts/index.js';

/**
 * Runs a tool handler and turns any failure (A2Me API down, timeout, unexpected data)
 * into a friendly, non-technical `isError` result instead of leaking a raw exception —
 * the graceful-error-handling both directories require. The real cause is logged
 * server-side for debugging.
 */
export async function handle<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T | { isError: true; content: { type: 'text'; text: string }[] }> {
  try {
    return await run();
  } catch (err) {
    console.error(`[tool ${label}] failed:`, err instanceof Error ? err.message : String(err));
    return {
      isError: true,
      content: [
        {
          type: 'text' as const,
          text: `Sorry — I couldn't reach A2Me to get your ${label} right now. Please try again in a moment.`,
        },
      ],
    };
  }
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  // ChatGPT Apps SDK: `_meta.openai/outputTemplate` links a tool to the `ui://` widget
  // that renders its structuredContent. Returns {} for tools without a widget.
  const uiMeta = (toolName: string): Record<string, unknown> => {
    const w = widgetForTool(toolName);
    return w ? widgetToolMeta(w) : {};
  };

  // Every tool in this server is read-only and reaches out to the external A2Me
  // API on behalf of the authenticated user, so all tools share these annotation
  // hints. Directory reviewers (Claude Connectors Directory, ChatGPT app
  // directory) require accurate `title` + `readOnlyHint`/`openWorldHint` on every
  // tool — missing/incorrect annotations are a leading cause of rejection.
  const readOnlyExternal = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  } as const;

  // Tool 1: Get family members
  server.registerTool(
    'get_family_members',
    {
      title: 'Get family members',
      description:
        "Returns the authenticated user's family members with relationship labels. Privacy-safe: no emails, phones, or full DOBs.",
      inputSchema: {},
      annotations: { title: 'Get family members', ...readOnlyExternal },
      _meta: uiMeta('get_family_members'),
    },
    async () => handle('family members', () => getFamilyMembers({})),
  );

  // Tool 2: Get upcoming family dates
  server.registerTool(
    'get_upcoming_family_dates',
    {
      title: 'Get upcoming family dates',
      description:
        'Returns upcoming birthdays, anniversaries, and family events. Dates shown as month-day only.',
      inputSchema: {
        daysAhead: z
          .number()
          .min(1)
          .max(365)
          .optional()
          .describe('Days to look ahead (default: 30)'),
      },
      annotations: { title: 'Get upcoming family dates', ...readOnlyExternal },
      _meta: uiMeta('get_upcoming_family_dates'),
    },
    async (input) =>
      handle('upcoming family dates', () =>
        getUpcomingFamilyDates({ daysAhead: input.daysAhead ?? 30 }),
      ),
  );

  // Tool 3: Get recent family activity
  server.registerTool(
    'get_recent_family_activity',
    {
      title: 'Get recent family activity',
      description:
        'Returns recent family activity (posts, photos, videos, birthday cards, events).',
      inputSchema: {
        sinceHours: z
          .number()
          .min(1)
          .max(720)
          .optional()
          .describe('Hours to look back (default: 72)'),
        limit: z.number().min(1).max(100).optional().describe('Max results (default: 20)'),
      },
      annotations: { title: 'Get recent family activity', ...readOnlyExternal },
    },
    async (input) =>
      handle('recent family activity', () =>
        getRecentFamilyActivity({ sinceHours: input.sinceHours ?? 72, limit: input.limit ?? 20 }),
      ),
  );

  // Tool 4: Get person profile
  server.registerTool(
    'get_person_profile',
    {
      title: 'Get person profile',
      description:
        "Returns a family member's profile with interests and recent activity. No private contact info.",
      inputSchema: { personId: z.string().min(1).describe('The person ID to look up') },
      annotations: { title: 'Get person profile', ...readOnlyExternal },
    },
    async (input) => handle('person profile', () => getPersonProfile({ personId: input.personId })),
  );

  // Tool 5: Get relationship between people
  server.registerTool(
    'get_relationship_between_people',
    {
      title: 'Get relationship between people',
      description: 'Returns the relationship between two family members in the family graph.',
      inputSchema: {
        personAId: z.string().min(1).describe('First person ID'),
        personBId: z.string().min(1).describe('Second person ID'),
      },
      annotations: { title: 'Get relationship between people', ...readOnlyExternal },
    },
    async (input) =>
      handle('relationship', () =>
        getRelationshipBetweenPeople({ personAId: input.personAId, personBId: input.personBId }),
      ),
  );

  // Tool 6: Get birthday card context
  server.registerTool(
    'get_birthday_card_context',
    {
      title: 'Get birthday card context',
      description:
        "Returns context for writing a birthday card — recipient's interests, memories, and tone suggestions.",
      inputSchema: {
        personId: z.string().min(1).describe('Person ID of the birthday card recipient'),
      },
      annotations: { title: 'Get birthday card context', ...readOnlyExternal },
    },
    async (input) =>
      handle('birthday card context', () => getBirthdayCardContext({ personId: input.personId })),
  );

  // Tool 7: Find family member
  server.registerTool(
    'find_family_member',
    {
      title: 'Find family member',
      description:
        'Searches for a family member by name or relationship. Supports "my grandmother", "mom", "Sarah".',
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe('Name, relationship, or natural reference (e.g., "Sarah", "my grandmother")'),
      },
      annotations: { title: 'Find family member', ...readOnlyExternal },
    },
    async (input) => handle('search', () => findFamilyMember({ query: input.query })),
  );

  // Tool 8: Answer family date question
  server.registerTool(
    'answer_family_date_question',
    {
      title: 'Answer family date question',
      description:
        'Answers natural language questions about family dates like "When is mom\'s birthday?"',
      inputSchema: {
        question: z.string().min(1).describe('Natural language question about family dates'),
      },
      annotations: { title: 'Answer family date question', ...readOnlyExternal },
    },
    async (input) =>
      handle('date answer', () => answerFamilyDateQuestion({ question: input.question })),
  );

  // Tool 9: Get message context for person
  server.registerTool(
    'get_message_context_for_person',
    {
      title: 'Get message context for person',
      description:
        'Returns context for writing a message to a family member with suggestions and privacy notes.',
      inputSchema: {
        personReference: z
          .string()
          .min(1)
          .describe('Who the message is for (name or relationship)'),
        occasion: z.string().optional().describe('Occasion (e.g., "birthday", "thank you")'),
        tone: z.string().optional().describe('Desired tone (e.g., "warm", "funny", "formal")'),
      },
      annotations: { title: 'Get message context for person', ...readOnlyExternal },
    },
    async (input) =>
      handle('message context', () =>
        getMessageContextForPerson({
          personReference: input.personReference,
          occasion: input.occasion,
          tone: input.tone,
        }),
      ),
  );

  // ChatGPT Apps SDK widget templates. Each is a `ui://` resource whose body is the
  // `text/html+skybridge` document ChatGPT loads in an iframe; the referenced bundle
  // renders the paired tool's structuredContent. Harmless to other MCP clients, which
  // simply ignore resources they don't request.
  for (const w of WIDGETS) {
    server.registerResource(
      w.asset,
      w.templateUri,
      { title: w.title, mimeType: WIDGET_MIME_TYPE, _meta: widgetToolMeta(w) },
      async () => ({
        contents: [
          {
            uri: w.templateUri,
            mimeType: WIDGET_MIME_TYPE,
            text: widgetHtml(w),
            _meta: widgetToolMeta(w),
          },
        ],
      }),
    );
  }

  // One-click starting points (Claude connector commands / ChatGPT suggestions).
  registerPrompts(server);

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`A2Me MCP Server v${config.serverVersion} running on stdio`);
}
