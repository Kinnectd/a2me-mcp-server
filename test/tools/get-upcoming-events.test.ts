import { describe, it, expect, vi } from 'vitest';
import { getUpcomingEvents } from '../../src/tools/get-upcoming-events.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_upcoming_events', () => {
  it('returns compact upcoming events with RSVP context', async () => {
    const result = await getUpcomingEvents({ limit: 5 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.upcomingEvents.length).toBeGreaterThan(0);
    const event = parsed.upcomingEvents[0];
    expect(event).toHaveProperty('title');
    expect(event).toHaveProperty('startTime');
    expect(event).toHaveProperty('endTime');
    expect(event).toHaveProperty('eventType');
    expect(event).toHaveProperty('myRsvpStatus');
    expect(event.rsvpCounts).toHaveProperty('attending');
  });

  it('respects the limit parameter', async () => {
    const result = await getUpcomingEvents({ limit: 1 });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.upcomingEvents).toHaveLength(1);
  });
});
