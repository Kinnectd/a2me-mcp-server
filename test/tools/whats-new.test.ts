import { describe, it, expect, vi } from 'vitest';
import { whatsNew } from '../../src/tools/whats-new.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('whats_new', () => {
  it('composes recent posts and upcoming dates into one bundle', async () => {
    const result = await whatsNew({ sinceDays: 7 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.sinceDays).toBe(7);
    expect(Array.isArray(parsed.recentPosts)).toBe(true);
    expect(parsed.recentPosts.length).toBeGreaterThan(0);
    expect(parsed.recentPosts[0]).toHaveProperty('author');
    expect(parsed.recentPosts[0]).toHaveProperty('snippet');
    expect(parsed.recentPosts[0]).toHaveProperty('date');
    expect(Array.isArray(parsed.upcomingDates)).toBe(true);
  });

  it('caps recent posts at 10', async () => {
    const result = await whatsNew({ sinceDays: 31 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.recentPosts.length).toBeLessThanOrEqual(10);
  });

  it('only includes upcoming dates within the next 14 days', async () => {
    const result = await whatsNew({ sinceDays: 7 });
    const parsed = JSON.parse(result.content[0].text);

    for (const date of parsed.upcomingDates) {
      expect(date.daysUntil).toBeLessThanOrEqual(14);
    }
  });

  it('only includes posts within the window', async () => {
    // Cutoff computed BEFORE the call: mock timestamps are generated during execution, so a
    // post-call Date.now() could race ahead of them and flake.
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const result = await whatsNew({ sinceDays: 1 });
    const parsed = JSON.parse(result.content[0].text);

    for (const post of parsed.recentPosts) {
      expect(new Date(post.date).getTime()).toBeGreaterThanOrEqual(cutoff);
    }
  });
});
