import { describe, it, expect, vi } from 'vitest';
import { getRecentFamilyActivity } from '../../src/tools/get-recent-family-activity.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_recent_family_activity', () => {
  it('returns recent activity with default parameters', async () => {
    const result = await getRecentFamilyActivity({ sinceHours: 72, limit: 20 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.recentActivity).toBeDefined();
    expect(Array.isArray(parsed.recentActivity)).toBe(true);
    expect(parsed.sinceHours).toBe(72);
  });

  it('respects limit parameter', async () => {
    const result = await getRecentFamilyActivity({ sinceHours: 720, limit: 2 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.recentActivity.length).toBeLessThanOrEqual(2);
  });

  it('returns correct activity shape', async () => {
    const result = await getRecentFamilyActivity({ sinceHours: 720, limit: 20 });
    const parsed = JSON.parse(result.content[0].text);

    if (parsed.recentActivity.length > 0) {
      const activity = parsed.recentActivity[0];
      expect(activity).toHaveProperty('activityId');
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('authorDisplayName');
      expect(activity).toHaveProperty('createdAt');
      expect(activity).toHaveProperty('summary');
      expect(activity).toHaveProperty('mediaCount');
      expect(activity).toHaveProperty('visibility');
    }
  });

  it('filters activities by time window', async () => {
    const result = await getRecentFamilyActivity({ sinceHours: 1, limit: 20 });
    const parsed = JSON.parse(result.content[0].text);
    const cutoff = new Date(Date.now() - 1 * 60 * 60 * 1000);

    for (const activity of parsed.recentActivity) {
      expect(new Date(activity.createdAt).getTime()).toBeGreaterThanOrEqual(cutoff.getTime());
    }
  });
});
