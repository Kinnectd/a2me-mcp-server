import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Exercises the real (non-mock) getFamilyMembers path with a stubbed fetch.
describe('A2MeApiClient.getFamilyMembers (live path)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('A2ME_USE_MOCK', 'false');
    vi.stubEnv('A2ME_API_URL', 'http://test.local/api');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('calls /me/v2/family and maps the DTO (month-day-only birthday)', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            viewerUserId: 'u0',
            members: [
              {
                user: {
                  id: 'u1',
                  username: 'jdoe',
                  fullName: 'Jane Doe',
                  preferredName: null,
                  birthDate: '1990-04-15',
                  deathDate: null,
                  avatarUrl: 'http://x/a.png',
                  managedAccountType: null,
                  memorializedAt: null,
                },
                neutralLabel: 'Parent',
                genderedLabel: 'Mother',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const members = await client.getFamilyMembers('u0');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://test.local/api/me/v2/family?includeLabels=true',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
    expect(members).toEqual([
      {
        personId: 'u1',
        displayName: 'Jane Doe',
        relationshipLabel: 'Parent',
        birthdayMonthDay: '04-15',
        profilePhotoUrl: 'http://x/a.png',
        isManagedAccount: false,
        isLegacyAccount: false,
      },
    ]);
  });

  it('falls back to genderedLabel when neutralLabel is missing (never empty)', async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            viewerUserId: 'u0',
            members: [
              {
                user: {
                  id: 'u2',
                  username: 'bob',
                  fullName: 'Bob',
                  preferredName: null,
                  birthDate: null,
                  deathDate: null,
                  avatarUrl: null,
                  managedAccountType: null,
                  memorializedAt: null,
                },
                genderedLabel: 'Uncle',
              },
            ],
          }),
          { status: 200 },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { A2MeApiClient } = await import('../../src/client/a2me-api-client.js');
    const client = new A2MeApiClient('http://test.local/api', 'tok');
    const [member] = await client.getFamilyMembers('u0');

    expect(member.relationshipLabel).toBe('Uncle');
    expect(member.birthdayMonthDay).toBeNull();
  });
});
