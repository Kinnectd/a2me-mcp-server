import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { resolvePersonReference } from '../resolver/family-context-resolver.js';

export const findFamilyMemberSchema = z.object({
  query: z.string().min(1),
});

export async function findFamilyMember(input: z.infer<typeof findFamilyMemberSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  // Match over the caller's real family (mock when A2ME_USE_MOCK is on).
  const family = await client.getFamilyMembers(auth.userId);
  const result = resolvePersonReference(auth.userId, input.query, family);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

export const findFamilyMemberToolDefinition = {
  name: 'find_family_member',
  description:
    'Searches for a family member by name or relationship label. Supports natural references like "my grandmother", "mom", "Sarah". Returns confidence-scored matches.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description:
          'Search query — a name, relationship label, or natural reference (e.g., "Sarah", "my grandmother", "uncle")',
      },
    },
    required: ['query'],
  },
};
