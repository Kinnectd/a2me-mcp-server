import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { getMessageContext } from '../resolver/family-context-resolver.js';

export const getMessageContextForPersonSchema = z.object({
  personReference: z.string().min(1),
  occasion: z.string().optional(),
  tone: z.string().optional(),
});

export async function getMessageContextForPerson(
  input: z.infer<typeof getMessageContextForPersonSchema>,
) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  // Compose over the caller's real family with their non-sensitive context (mock when
  // A2ME_USE_MOCK is on).
  const family = await client.getFamilyMembersDetailed(auth.userId);
  const context = getMessageContext(
    auth.userId,
    input.personReference,
    input.occasion,
    input.tone,
    family,
  );

  if (!context) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            error: `Could not resolve person "${input.personReference}". Try using their full name or relationship label.`,
          }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(context, null, 2),
      },
    ],
  };
}

export const getMessageContextForPersonToolDefinition = {
  name: 'get_message_context_for_person',
  description:
    'Returns context for writing a message to a family member, including their interests, relationship, occasion-appropriate suggestions, and privacy notes. Resolves natural references like "mom" or "Sarah".',
  inputSchema: {
    type: 'object' as const,
    properties: {
      personReference: {
        type: 'string',
        description:
          'Who the message is for — a name or relationship (e.g., "Sarah", "my grandmother", "uncle")',
      },
      occasion: {
        type: 'string',
        description:
          'The occasion for the message (e.g., "birthday", "thank you", "thinking of you")',
      },
      tone: {
        type: 'string',
        description: 'Desired tone (e.g., "warm", "funny", "formal", "casual")',
      },
    },
    required: ['personReference'],
  },
};
