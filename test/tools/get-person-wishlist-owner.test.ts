import { describe, it, expect, vi, afterEach } from 'vitest';
import { A2MeApiClient } from '../../src/client/a2me-api-client.js';
import { getPersonWishlist } from '../../src/tools/get-person-wishlist.js';

// requireAuth() returns a placeholder id that is NOT the live user's id.
vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Placeholder', isAuthenticated: true }),
}));
vi.mock('../../src/tools/resolve-person.js', () => ({
  resolvePersonInput: async () => ({ ok: true, personId: 'live-user-42', displayName: 'Me' }),
}));

afterEach(() => vi.restoreAllMocks());

describe('get_person_wishlist ownership guard uses the real signed-in id', () => {
  it('passes the GET /me id (not the auth placeholder) as the viewer', async () => {
    vi.spyOn(A2MeApiClient.prototype, 'getMe').mockResolvedValue({ id: 'live-user-42', displayName: 'Me' });
    const lists = vi.spyOn(A2MeApiClient.prototype, 'getPersonWishlists').mockResolvedValue([
      { title: 'Mine', description: null, items: [{ name: 'Lego', note: null, url: null, priceEstimate: null }] },
    ]);

    const result = await getPersonWishlist({ personName: 'me' });

    expect(lists).toHaveBeenCalledWith('live-user-42', 'live-user-42');
    expect(result.content[0].text).not.toContain('isPurchased');
  });
});
