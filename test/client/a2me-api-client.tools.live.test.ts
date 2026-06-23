import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Exercises the real (non-mock) paths of the newly wired client methods with a stubbed fetch that
// routes by URL. Verifies the DTO→tool-shape mapping (and privacy redaction) against the documented
// kinnectd-api response shapes, without a live API.

const USER = 'u0';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function familyMember(over: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'p1',
      username: 'jdoe',
      fullName: 'Jane Doe',
      preferredName: null,
      birthDate: '1990-04-15',
      deathDate: null,
      avatarUrl: null,
      managedAccountType: null,
      memorializedAt: null,
      bio: 'Loves the garden.',
      interests: 'gardening, reading',
      ...over,
    },
    neutralLabel: 'Parent',
    genderedLabel: 'Mother',
  };
}

/** Installs a fetch stub that dispatches on the requested path. */
function routeFetch(routes: Array<[RegExp, () => unknown]>) {
  const fetchMock = vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    for (const [pattern, body] of routes) {
      if (pattern.test(u)) return jsonResponse(body());
    }
    throw new Error(`unexpected fetch: ${u}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('A2MeApiClient live tool paths', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('A2ME_USE_MOCK', 'false');
    vi.stubEnv('A2ME_API_URL', 'http://test.local/api');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('getUpcomingDates merges family birthdays (month-day only) and upcoming events', async () => {
    const soon = new Date(Date.now() + 5 * 86400000); // 5 days out
    routeFetch([
      [/\/me\/v2\/family/, () => ({ viewerUserId: USER, members: [familyMember()] })],
      [
        /\/events/,
        () => ({
          content: [
            {
              id: 'e1',
              title: 'Family Reunion',
              startTime: soon.toISOString(),
              endTime: soon.toISOString(),
              owner: { id: 'p1', username: 'jdoe', fullName: 'Jane Doe' },
              guests: [{ user: { id: 'p2', username: 'bob', fullName: 'Bob' } }],
            },
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const dates = await client.getUpcomingDates(USER, 365);

    const birthday = dates.find((d) => d.type === 'birthday');
    const event = dates.find((d) => d.type === 'event');
    expect(birthday).toBeDefined();
    expect(birthday!.date).toBe('04-15'); // month-day, no year
    expect(birthday!.relationshipLabels).toEqual(['Parent']);
    expect(event).toBeDefined();
    expect(event!.title).toBe('Family Reunion');
    expect(event!.relatedPersonIds).toContain('p1');
    expect(event!.relatedPersonIds).toContain('p2');
    expect(event!.date).toMatch(/^\d{2}-\d{2}$/);
    // sorted by soonest
    expect(dates[0].daysUntil).toBeLessThanOrEqual(dates[dates.length - 1].daysUntil);
  });

  it('getUpcomingDates reports a birthday today as 0 days away (not ~365)', async () => {
    const now = new Date();
    const todayMonthDay = `${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
      now.getUTCDate(),
    ).padStart(2, '0')}`;
    routeFetch([
      [
        /\/me\/v2\/family/,
        () => ({
          viewerUserId: USER,
          members: [familyMember({ birthDate: `1990-${todayMonthDay}` })],
        }),
      ],
      [/\/events/, () => ({ content: [] })],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const dates = await client.getUpcomingDates(USER, 30);
    const birthday = dates.find((d) => d.type === 'birthday');
    expect(birthday).toBeDefined();
    expect(birthday!.daysUntil).toBe(0);
  });

  it('getUpcomingDates filters out dates beyond daysAhead', async () => {
    const far = new Date(Date.now() + 200 * 86400000);
    routeFetch([
      [/\/me\/v2\/family/, () => ({ viewerUserId: USER, members: [] })],
      [
        /\/events/,
        () => ({
          content: [
            {
              id: 'e1',
              title: 'Far Event',
              startTime: far.toISOString(),
              endTime: far.toISOString(),
              owner: { id: 'p1', username: 'jdoe', fullName: 'Jane Doe' },
            },
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const dates = await client.getUpcomingDates(USER, 30);
    expect(dates).toEqual([]);
  });

  it('getRecentActivity maps PostDTO to redacted activity and respects the time window', async () => {
    const now = new Date().toISOString();
    routeFetch([
      [
        /\/posts\/feed/,
        () => ({
          content: [
            {
              id: 'post1',
              content: 'Had a wonderful day at the lake with everyone!',
              createdAt: now,
              creator: { id: 'p1', username: 'jdoe', preferredName: 'Janie', fullName: 'Jane Doe' },
              mediaFiles: [{ id: 'm1', mediaType: 'IMAGE' }],
              visibility: 'CLOSE_FAMILY',
            },
            {
              id: 'post2',
              content: null,
              createdAt: now,
              creator: { id: 'p2', username: 'bob', preferredName: null, fullName: 'Bob' },
              mediaFiles: [
                { id: 'm2', mediaType: 'VIDEO' },
                { id: 'm3', mediaType: 'IMAGE' },
              ],
              visibility: 'EXTENDED_FAMILY',
            },
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const activity = await client.getRecentActivity(USER, 72, 20);

    expect(activity).toHaveLength(2);
    expect(activity[0]).toMatchObject({
      activityId: 'post1',
      type: 'photo',
      authorDisplayName: 'Janie', // preferredName preferred
      summary: 'Had a wonderful day at the lake with everyone!',
      mediaCount: 1,
      visibility: 'close_family', // lowercased
    });
    // No content → synthesized summary; VIDEO present → type video
    expect(activity[1]).toMatchObject({
      activityId: 'post2',
      type: 'video',
      mediaCount: 2,
      visibility: 'extended_family',
    });
    expect(activity[1].summary).toBe('Shared 2 videos.');
  });

  it('getPersonProfile composes family detail + the person’s recent post summary', async () => {
    routeFetch([
      [/\/me\/v2\/family/, () => ({ viewerUserId: USER, members: [familyMember()] })],
      [
        /\/posts\/users\/p1/,
        () => ({
          content: [
            {
              id: 'post9',
              content: 'Planted tomatoes today.',
              createdAt: new Date().toISOString(),
              creator: { id: 'p1', username: 'jdoe', fullName: 'Jane Doe' },
              mediaFiles: [],
              visibility: 'CLOSE_FAMILY',
            },
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const profile = await client.getPersonProfile(USER, 'p1');

    expect(profile).not.toBeNull();
    expect(profile!.displayName).toBe('Jane Doe');
    expect(profile!.relationshipLabel).toBe('Parent');
    expect(profile!.birthdayMonthDay).toBe('04-15');
    expect(profile!.knownInterests).toEqual(['gardening', 'reading']);
    expect(profile!.bioSummary).toBe('Loves the garden.');
    expect(profile!.importantDates).toEqual([{ label: 'Birthday', date: '04-15' }]);
    expect(profile!.recentActivitySummary).toBe('Planted tomatoes today.');
  });

  it('getPersonProfile returns null when the person is not in the family', async () => {
    routeFetch([[/\/me\/v2\/family/, () => ({ viewerUserId: USER, members: [familyMember()] })]]);
    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    expect(await client.getPersonProfile(USER, 'nobody')).toBeNull();
  });

  it('getBirthdayCardContext composes recipient detail, memories, and null contributor count', async () => {
    routeFetch([
      [/\/me\/v2\/family/, () => ({ viewerUserId: USER, members: [familyMember()] })],
      [
        /\/posts\/users\/p1/,
        () => ({
          content: [
            {
              id: 'post9',
              content: 'Sunset over the hills.',
              createdAt: new Date().toISOString(),
              creator: { id: 'p1', username: 'jdoe', fullName: 'Jane Doe' },
              mediaFiles: [{ id: 'm', mediaType: 'IMAGE' }],
              visibility: 'CLOSE_FAMILY',
            },
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const ctx = await client.getBirthdayCardContext(USER, 'p1');

    expect(ctx).not.toBeNull();
    expect(ctx!.recipientName).toBe('Jane Doe');
    expect(ctx!.birthdayMonthDay).toBe('04-15');
    expect(ctx!.relationshipToUser).toBe('Parent');
    expect(ctx!.knownInterests).toEqual(['gardening', 'reading']);
    expect(ctx!.recentMemories).toEqual(['Sunset over the hills.']);
    expect(ctx!.existingContributorCount).toBeNull();
  });

  it('getRelationshipBetween derives a label from the family list', async () => {
    routeFetch([
      [
        /\/me\/v2\/family/,
        () => ({
          viewerUserId: USER,
          members: [
            familyMember(),
            familyMember({ id: 'p2', fullName: 'Bob Doe', preferredName: null }),
          ],
        }),
      ],
    ]);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const rel = await client.getRelationshipBetween(USER, 'p1', 'p2');
    expect(rel).not.toBeNull();
    expect(rel!.personA.displayName).toBe('Jane Doe');
    expect(rel!.personB.displayName).toBe('Bob Doe');
    expect(rel!.relationshipLabel).toContain('Parent');
  });
});
