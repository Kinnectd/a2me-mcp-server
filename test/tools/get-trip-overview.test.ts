import { describe, it, expect, vi } from 'vitest';
import { getTripOverview } from '../../src/tools/get-trip-overview.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_trip_overview', () => {
  it('asks to disambiguate when no tripName is given and several trips are upcoming', async () => {
    const result = await getTripOverview({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.message).toContain('which one');
    expect(parsed.tripNames).toHaveLength(2);
    expect(parsed.tripNames).toContain('Lake Tahoe Family Reunion');
  });

  it('returns the full overview for a fuzzy tripName match', async () => {
    const result = await getTripOverview({ tripName: 'tahoe' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.trip.title).toBe('Lake Tahoe Family Reunion');
    expect(parsed.trip.destination).toBe('Lake Tahoe, CA');
    expect(parsed.roster.length).toBeGreaterThan(0);
    expect(parsed.roster[0]).toHaveProperty('rsvpStatus');
    // Travel details answer "when does Sarah land"
    const sarah = parsed.travelDetails.find(
      (d: { displayName: string }) => d.displayName === 'Sarah Walker',
    );
    expect(sarah.arrival.flightNumber).toBe('UA512');
    expect(sarah.lodging).toContain('Cabin');
    // Itinerary items sorted by time
    expect(parsed.itinerary.length).toBeGreaterThan(0);
    const times = parsed.itinerary.map((i: { startTime: string }) => i.startTime);
    expect([...times].sort()).toEqual(times);
  });

  it('matches trip names case-insensitively', async () => {
    const result = await getTripOverview({ tripName: 'LAKE TAHOE' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.trip.title).toBe('Lake Tahoe Family Reunion');
  });

  it('lists available trips when the name matches nothing', async () => {
    const result = await getTripOverview({ tripName: 'antarctica' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.message).toContain('No trip found');
    expect(parsed.tripNames).toHaveLength(2);
  });

  it('masks pending invite emails', async () => {
    const result = await getTripOverview({ tripName: 'tahoe' });
    const parsed = JSON.parse(result.content[0].text);

    for (const invite of parsed.pendingInvites) {
      expect(invite.maskedEmail).toContain('***');
      expect(invite.maskedEmail).not.toMatch(/^[^*]+@[^*]+$/);
    }
  });
});
