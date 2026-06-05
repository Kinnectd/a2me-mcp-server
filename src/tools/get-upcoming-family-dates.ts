import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getUpcomingFamilyDatesSchema = z.object({
  daysAhead: z.number().min(1).max(365).optional().default(30),
});

export async function getUpcomingFamilyDates(input: z.infer<typeof getUpcomingFamilyDatesSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const dates = await client.getUpcomingDates(auth.userId, input.daysAhead);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            upcomingDates: dates,
            daysAhead: input.daysAhead,
            totalCount: dates.length,
          },
          null,
          2,
        ),
      },
    ],
  };
}

export const getUpcomingFamilyDatesToolDefinition = {
  name: 'get_upcoming_family_dates',
  description:
    'Returns upcoming birthdays, anniversaries, and family events within the specified number of days. Dates shown as month-day only for privacy.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      daysAhead: {
        type: 'number',
        description: 'Number of days to look ahead (default: 30, max: 365)',
      },
    },
  },
};
