import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getUpcomingEventsSchema = z.object({
  limit: z.number().min(1).max(10).optional().default(5),
});

export async function getUpcomingEvents(input: z.infer<typeof getUpcomingEventsSchema>) {
  requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const events = await client.getUpcomingEvents(input.limit);

  const structuredContent = {
    upcomingEvents: events,
    totalCount: events.length,
  };

  return {
    structuredContent,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
  };
}

export const getUpcomingEventsToolDefinition = {
  name: 'get_upcoming_events',
  description:
    "Upcoming events the user is invited to or hosting, with dates and their RSVP status. Use for questions like 'what's coming up' or 'when is the reunion'.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of events to return (default: 5, max: 10)',
      },
    },
  },
};
