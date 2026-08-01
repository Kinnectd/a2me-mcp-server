import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import type { FeedPost } from '../types/index.js';
import { resolvePersonInput } from './resolve-person.js';

// NOTE: kinnectd-api has no post-search endpoint yet, so this scans the recent feed (≤100 posts)
// and filters client-side. Server-side search is a future upgrade — swap the scan for that
// endpoint when it lands.

export const searchFamilyMemoriesSchema = z.object({
  query: z.string().min(1),
  personName: z.string().min(1).optional(),
  sinceDays: z.number().min(1).max(3650).optional().default(365),
});

const MAX_RESULTS = 8;
const SNIPPET_LENGTH = 140;

function termsOf(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/** Number of query terms found in the post's content or author name. */
function scorePost(post: FeedPost, terms: string[]): number {
  const haystack = `${post.content} ${post.authorDisplayName}`.toLowerCase();
  return terms.filter((t) => haystack.includes(t)).length;
}

/** A ~140-char window of the content centered on the first matched term. */
function snippetOf(content: string, terms: string[]): string {
  const lower = content.toLowerCase();
  const firstHit = terms.map((t) => lower.indexOf(t)).find((i) => i >= 0) ?? -1;
  if (content.length <= SNIPPET_LENGTH) return content;
  const start = Math.max(0, Math.min(firstHit, content.length - SNIPPET_LENGTH));
  const slice = content.slice(start, start + SNIPPET_LENGTH).trim();
  return `${start > 0 ? '…' : ''}${slice}…`;
}

export async function searchFamilyMemories(input: z.infer<typeof searchFamilyMemoriesSchema>) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);

  let authorFilter: string | null = null;
  if (input.personName) {
    const resolved = await resolvePersonInput(client, auth.userId, input.personName);
    if (!resolved.ok) {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify({ error: resolved.message }) }],
      };
    }
    authorFilter = resolved.displayName;
  }

  const cutoff = new Date(Date.now() - input.sinceDays * 24 * 60 * 60 * 1000);
  const terms = termsOf(input.query);
  const posts = await client.getFeedPosts(100);

  const matches = posts
    .filter((p) => new Date(p.createdAt) >= cutoff)
    .filter((p) => authorFilter === null || p.authorDisplayName === authorFilter)
    .map((post) => ({ post, score: scorePost(post, terms) }))
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score || b.post.createdAt.localeCompare(a.post.createdAt))
    .slice(0, MAX_RESULTS)
    .map(({ post }) => ({
      postId: post.postId,
      author: post.authorDisplayName,
      date: post.createdAt,
      snippet: snippetOf(post.content, terms),
      hasMedia: post.hasMedia,
    }));

  const structuredContent = {
    query: input.query,
    sinceDays: input.sinceDays,
    results: matches,
    totalCount: matches.length,
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

export const searchFamilyMemoriesToolDefinition = {
  name: 'search_family_memories',
  description:
    "Search recent family posts and memories by keyword, optionally filtered to one person or a time window. Use for 'what did we do last summer' or 'find the post about the lake trip'.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Keywords to search for in post content and author names',
      },
      personName: {
        type: 'string',
        description: 'Optionally restrict results to posts by this family member (fuzzy name)',
      },
      sinceDays: {
        type: 'number',
        description: 'How many days back to search (default: 365, max: 3650)',
      },
    },
    required: ['query'],
  },
};
