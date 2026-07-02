import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getFamilyMembersSchema = z.object({});

export async function getFamilyMembers(_input: z.infer<typeof getFamilyMembersSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const members = await client.getFamilyMembers(auth.userId);

  const familyMembers = members.filter((m) => m.personId !== auth.userId);
  const structuredContent = { familyMembers, totalCount: familyMembers.length };

  return {
    // structuredContent is what the ChatGPT widget renders (window.openai.toolOutput);
    // the text content is the model-facing rendering.
    structuredContent,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
  };
}

export const getFamilyMembersToolDefinition = {
  name: 'get_family_members',
  description:
    "Returns the authenticated user's family members with relationship labels. Does not include emails, phone numbers, or full birth dates for privacy.",
  inputSchema: {
    type: 'object' as const,
    properties: {},
  },
};
