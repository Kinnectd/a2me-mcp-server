import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getRelationshipBetweenPeopleSchema = z.object({
  personAId: z.string().min(1),
  personBId: z.string().min(1),
});

export async function getRelationshipBetweenPeople(
  input: z.infer<typeof getRelationshipBetweenPeopleSchema>,
) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const result = await client.getRelationshipBetween(auth.userId, input.personAId, input.personBId);

  if (!result) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `Could not determine relationship between "${input.personAId}" and "${input.personBId}".`,
          }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const getRelationshipBetweenPeopleToolDefinition = {
  name: 'get_relationship_between_people',
  description:
    'Returns the relationship between two family members, including how they are connected in the family graph.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      personAId: {
        type: 'string',
        description: 'The first person ID',
      },
      personBId: {
        type: 'string',
        description: 'The second person ID',
      },
    },
    required: ['personAId', 'personBId'],
  },
};
