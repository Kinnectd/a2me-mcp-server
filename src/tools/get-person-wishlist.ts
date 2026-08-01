import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { resolvePersonInput } from './resolve-person.js';

export const getPersonWishlistSchema = z.object({
  personName: z.string().min(1),
});

export async function getPersonWishlist(input: z.infer<typeof getPersonWishlistSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);

  const resolved = await resolvePersonInput(client, auth.userId, input.personName);
  if (!resolved.ok) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: resolved.message }) }],
    };
  }

  const wishlists = await client.getPersonWishlists(resolved.personId);
  if (wishlists.length === 0 || wishlists.every((w) => w.items.length === 0)) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({
            message: `${resolved.displayName}'s wishlist is empty or not shared with you.`,
          }),
        },
      ],
    };
  }

  const structuredContent = {
    personName: resolved.displayName,
    wishlists,
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

export const getPersonWishlistToolDefinition = {
  name: 'get_person_wishlist',
  description:
    "A family member's wishlist — for gift ideas and birthday/holiday planning. Items include notes, links, and price estimates when the person shared them.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      personName: {
        type: 'string',
        description: 'Family member name or relationship (fuzzy)',
      },
    },
    required: ['personName'],
  },
};
