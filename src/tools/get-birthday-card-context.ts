import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';

export const getBirthdayCardContextSchema = z.object({
  personId: z.string().min(1),
});

export async function getBirthdayCardContext(input: z.infer<typeof getBirthdayCardContextSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const context = await client.getBirthdayCardContext(auth.userId, input.personId);

  if (!context) {
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
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(context, null, 2),
      },
    ],
  };
}

export const getBirthdayCardContextToolDefinition = {
  name: 'get_birthday_card_context',
  description:
    "Returns context for writing a birthday card including the recipient's interests, relationship, recent memories, and suggested tones.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      personId: {
        type: 'string',
        description: 'The person ID of the birthday card recipient',
      },
    },
    required: ['personId'],
  },
};
