import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getRecentFamilyActivitySchema = z.object({
  sinceHours: z.number().min(1).max(720).optional().default(72),
  limit: z.number().min(1).max(100).optional().default(20),
});

export async function getRecentFamilyActivity(
  input: z.infer<typeof getRecentFamilyActivitySchema>,
) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const activities = await client.getRecentActivity(auth.userId, input.sinceHours, input.limit);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            recentActivity: activities,
            sinceHours: input.sinceHours,
            totalCount: activities.length,
          },
          null,
          2,
        ),
      },
    ],
  };
}

export const getRecentFamilyActivityToolDefinition = {
  name: 'get_recent_family_activity',
  description:
    'Returns recent family activity (posts, photos, videos, birthday cards, events) within the specified time window.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sinceHours: {
        type: 'number',
        description: 'How many hours back to look (default: 72, max: 720)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of activities to return (default: 20, max: 100)',
      },
    },
  },
};
