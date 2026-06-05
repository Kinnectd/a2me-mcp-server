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

export function createServer(): McpServer {
  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  // Tool 1: Get family members
  server.tool(
    'get_family_members',
    "Returns the authenticated user's family members with relationship labels. Privacy-safe: no emails, phones, or full DOBs.",
    {},
    async () => getFamilyMembers({}),
  );

  // Tool 2: Get upcoming family dates
  server.tool(
    'get_upcoming_family_dates',
    'Returns upcoming birthdays, anniversaries, and family events. Dates shown as month-day only.',
    {
      daysAhead: z.number().min(1).max(365).optional().describe('Days to look ahead (default: 30)'),
    },
    async (input) => getUpcomingFamilyDates({ daysAhead: input.daysAhead ?? 30 }),
  );

  // Tool 3: Get recent family activity
  server.tool(
    'get_recent_family_activity',
    'Returns recent family activity (posts, photos, videos, birthday cards, events).',
    {
      sinceHours: z
        .number()
        .min(1)
        .max(720)
        .optional()
        .describe('Hours to look back (default: 72)'),
      limit: z.number().min(1).max(100).optional().describe('Max results (default: 20)'),
    },
    async (input) =>
      getRecentFamilyActivity({ sinceHours: input.sinceHours ?? 72, limit: input.limit ?? 20 }),
  );

  // Tool 4: Get person profile
  server.tool(
    'get_person_profile',
    "Returns a family member's profile with interests and recent activity. No private contact info.",
    { personId: z.string().min(1).describe('The person ID to look up') },
    async (input) => getPersonProfile({ personId: input.personId }),
  );

  // Tool 5: Get relationship between people
  server.tool(
    'get_relationship_between_people',
    'Returns the relationship between two family members in the family graph.',
    {
      personAId: z.string().min(1).describe('First person ID'),
      personBId: z.string().min(1).describe('Second person ID'),
    },
    async (input) =>
      getRelationshipBetweenPeople({ personAId: input.personAId, personBId: input.personBId }),
  );

  // Tool 6: Get birthday card context
  server.tool(
    'get_birthday_card_context',
    "Returns context for writing a birthday card — recipient's interests, memories, and tone suggestions.",
    { personId: z.string().min(1).describe('Person ID of the birthday card recipient') },
    async (input) => getBirthdayCardContext({ personId: input.personId }),
  );

  // Tool 7: Find family member
  server.tool(
    'find_family_member',
    'Searches for a family member by name or relationship. Supports "my grandmother", "mom", "Sarah".',
    {
      query: z
        .string()
        .min(1)
        .describe('Name, relationship, or natural reference (e.g., "Sarah", "my grandmother")'),
    },
    async (input) => findFamilyMember({ query: input.query }),
  );

  // Tool 8: Answer family date question
  server.tool(
    'answer_family_date_question',
    'Answers natural language questions about family dates like "When is mom\'s birthday?"',
    { question: z.string().min(1).describe('Natural language question about family dates') },
    async (input) => answerFamilyDateQuestion({ question: input.question }),
  );

  // Tool 9: Get message context for person
  server.tool(
    'get_message_context_for_person',
    'Returns context for writing a message to a family member with suggestions and privacy notes.',
    {
      personReference: z.string().min(1).describe('Who the message is for (name or relationship)'),
      occasion: z.string().optional().describe('Occasion (e.g., "birthday", "thank you")'),
      tone: z.string().optional().describe('Desired tone (e.g., "warm", "funny", "formal")'),
    },
    async (input) =>
      getMessageContextForPerson({
        personReference: input.personReference,
        occasion: input.occasion,
        tone: input.tone,
      }),
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`A2Me MCP Server v${config.serverVersion} running on stdio`);
}
