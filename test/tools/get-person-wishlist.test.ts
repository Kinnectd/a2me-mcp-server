import { describe, it, expect, vi } from 'vitest';
import { getPersonWishlist } from '../../src/tools/get-person-wishlist.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_person_wishlist', () => {
  it('returns wishlist items for a person with a shared wishlist', async () => {
    const result = await getPersonWishlist({ personName: 'sister' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.personName).toBe('Sarah Walker');
    expect(parsed.wishlists.length).toBeGreaterThan(0);
    const item = parsed.wishlists[0].items[0];
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('priceEstimate');
  });

  it('says so when the wishlist is empty or not shared', async () => {
    const result = await getPersonWishlist({ personName: 'uncle' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.message).toContain('empty or not shared');
  });

  it('returns an error for an unknown person', async () => {
    const result = await getPersonWishlist({ personName: 'zzz-nobody' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toContain('zzz-nobody');
  });
});
