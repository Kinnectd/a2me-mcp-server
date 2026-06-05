import { describe, it, expect, vi } from 'vitest';
import { getUpcomingFamilyDates } from '../../src/tools/get-upcoming-family-dates.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_upcoming_family_dates', () => {
  it('returns upcoming dates within default 30 days', async () => {
    const result = await getUpcomingFamilyDates({ daysAhead: 30 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.upcomingDates).toBeDefined();
    expect(parsed.daysAhead).toBe(30);
    expect(Array.isArray(parsed.upcomingDates)).toBe(true);

    for (const date of parsed.upcomingDates) {
      expect(date.daysUntil).toBeLessThanOrEqual(30);
    }
  });

  it('respects daysAhead parameter', async () => {
    const result7 = await getUpcomingFamilyDates({ daysAhead: 7 });
    const result365 = await getUpcomingFamilyDates({ daysAhead: 365 });

    const parsed7 = JSON.parse(result7.content[0].text);
    const parsed365 = JSON.parse(result365.content[0].text);

    expect(parsed365.totalCount).toBeGreaterThanOrEqual(parsed7.totalCount);
  });

  it('returns correct date shape', async () => {
    const result = await getUpcomingFamilyDates({ daysAhead: 365 });
    const parsed = JSON.parse(result.content[0].text);

    if (parsed.upcomingDates.length > 0) {
      const date = parsed.upcomingDates[0];
      expect(date).toHaveProperty('date');
      expect(date).toHaveProperty('type');
      expect(date).toHaveProperty('title');
      expect(date).toHaveProperty('relatedPersonIds');
      expect(date).toHaveProperty('daysUntil');
      expect(['birthday', 'anniversary', 'event']).toContain(date.type);
    }
  });

  it('does not expose full birth years', async () => {
    const result = await getUpcomingFamilyDates({ daysAhead: 365 });
    const text = result.content[0].text;
    // Month-day format only (MM-DD), not full dates with years
    const parsed = JSON.parse(text);
    for (const date of parsed.upcomingDates) {
      if (date.date) {
        expect(date.date).toMatch(/^\d{2}-\d{2}$/);
      }
    }
  });
});
