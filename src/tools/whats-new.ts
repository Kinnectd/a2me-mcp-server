import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const whatsNewSchema = z.object({
  sinceDays: z.number().min(1).max(31).optional().default(7),
});

const RECENT_POSTS_LIMIT = 10;
const UPCOMING_DAYS_AHEAD = 14;

export async function whatsNew(input: z.infer<typeof whatsNewSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);

  // Pure composition over the existing read primitives — recent feed + upcoming dates.
  const [recentActivity, upcomingDates] = await Promise.all([
    client.getRecentActivity(auth.userId, input.sinceDays * 24, RECENT_POSTS_LIMIT),
    client.getUpcomingDates(auth.userId, UPCOMING_DAYS_AHEAD),
  ]);

  const structuredContent = {
    sinceDays: input.sinceDays,
    recentPosts: recentActivity.map((a) => ({
      author: a.authorDisplayName,
      snippet: a.summary,
      date: a.createdAt,
    })),
    upcomingDates,
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

export const whatsNewToolDefinition = {
  name: 'whats_new',
  description:
    "A catch-up summary of what happened in the user's family recently plus what's coming up. Use when the user asks 'what did I miss' or 'catch me up'.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      sinceDays: {
        type: 'number',
        description: 'How many days back to summarize (default: 7, max: 31)',
      },
    },
  },
};
