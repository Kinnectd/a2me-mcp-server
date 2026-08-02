import { describe, it, expect, vi } from 'vitest';
import { searchFamilyMemories } from '../../src/tools/search-family-memories.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('search_family_memories', () => {
  it('finds posts matching the query and ranks multi-term matches first', async () => {
    const result = await searchFamilyMemories({ query: 'lake trip', sinceDays: 365 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.results.length).toBeGreaterThan(0);
    // post-104 matches both "lake" and "trip" — it should rank first.
    expect(parsed.results[0].postId).toBe('post-104');
    expect(parsed.results[0].author).toBe('Robert Walker');
    expect(parsed.results[0].hasMedia).toBe(true);
  });

  it('excludes posts older than sinceDays', async () => {
    const within = await searchFamilyMemories({ query: 'lake', sinceDays: 3650 });
    const withinParsed = JSON.parse(within.content[0].text);
    const recent = await searchFamilyMemories({ query: 'lake', sinceDays: 365 });
    const recentParsed = JSON.parse(recent.content[0].text);

    const ids = (r: { results: { postId: string }[] }): string[] => r.results.map((h) => h.postId);
    // post-107 is ~400 days old: visible at 10 years, filtered at 1 year.
    expect(ids(withinParsed)).toContain('post-107');
    expect(ids(recentParsed)).not.toContain('post-107');
  });

  it('filters to a single person when personName is given', async () => {
    const result = await searchFamilyMemories({
      query: 'lake',
      personName: 'Sarah',
      sinceDays: 3650,
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.results.length).toBeGreaterThan(0);
    for (const hit of parsed.results) {
      expect(hit.author).toBe('Sarah Walker');
    }
  });

  it('keeps snippets short', async () => {
    const result = await searchFamilyMemories({ query: 'hike', sinceDays: 365 });
    const parsed = JSON.parse(result.content[0].text);

    for (const hit of parsed.results) {
      expect(hit.snippet.length).toBeLessThanOrEqual(150);
    }
  });

  it('returns empty results for a query matching nothing', async () => {
    const result = await searchFamilyMemories({ query: 'xylophone-quantum', sinceDays: 365 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.results).toHaveLength(0);
    expect(parsed.totalCount).toBe(0);
  });

  it('returns an error for an unknown personName', async () => {
    const result = await searchFamilyMemories({
      query: 'lake',
      personName: 'zzz-nobody',
      sinceDays: 365,
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toContain('zzz-nobody');
  });
});
