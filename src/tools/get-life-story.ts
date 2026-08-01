import { z } from 'zod';
import { ApiHttpError } from '../client/a2me-api-client.js';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { resolvePersonInput } from './resolve-person.js';

export const getLifeStorySchema = z.object({
  personName: z.string().min(1),
});

export async function getLifeStory(input: z.infer<typeof getLifeStorySchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  try {

  const resolved = await resolvePersonInput(client, auth.userId, input.personName);
  if (!resolved.ok) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: resolved.message }) }],
    };
  }

  const story = await client.getLifeStory(resolved.personId, resolved.displayName);
  if (!story) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            message: `No life story has been recorded for ${resolved.displayName} yet — answering their story questions is how it gets built.`,
          }),
        },
      ],
    };
  }

  return {
    structuredContent: story as unknown as Record<string, unknown>,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(story, null, 2),
      },
    ],
  };
  } catch (err) {
    if (err instanceof ApiHttpError && err.status === 403) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              error:
                'The server declined access to this data (permission denied) — this is an access problem, not empty data. If this connection is new, the A2Me API may not have rolled out access for this tool yet.',
            }),
          },
        ],
      };
    }
    throw err;
  }
}


export const getLifeStoryToolDefinition = {
  name: 'get_life_story',
  description:
    "The written life story (biography chapters) of a family member, built from family memories. Use for 'tell me about grandma's childhood', writing toasts/speeches/eulogies, or family history questions. Falls back to recently recorded story answers when no narrative exists yet.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      personName: {
        type: 'string',
        description: 'Family member name or relationship (fuzzy), or "me" for the user themselves',
      },
    },
    required: ['personName'],
  },
};
