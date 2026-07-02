import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getPersonProfileSchema = z.object({
  personId: z.string().min(1),
});

export async function getPersonProfile(input: z.infer<typeof getPersonProfileSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const profile = await client.getPersonProfile(auth.userId, input.personId);

  if (!profile) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ error: `No person found with ID "${input.personId}".` }),
        },
      ],
    };
  }

  return {
    // structuredContent drives the ChatGPT person-profile widget.
    structuredContent: { profile },
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(profile, null, 2),
      },
    ],
  };
}

export const getPersonProfileToolDefinition = {
  name: 'get_person_profile',
  description:
    "Returns a family member's profile including their interests, relationship, and recent activity summary. Does not expose private contact information.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      personId: {
        type: 'string',
        description: 'The person ID to look up',
      },
    },
    required: ['personId'],
  },
};
