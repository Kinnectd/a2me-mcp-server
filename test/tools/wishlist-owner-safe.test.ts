import { describe, it, expect } from 'vitest';
import { toWishlistItems, type ApiWishlistDetailDTO } from '../../src/client/a2me-api-client.js';

const item = { name: 'Lego', description: null, url: null, priceEstimate: '$40', notes: null };

describe('wishlist items are owner-safe (kinnectd-api#1650 surprise protection)', () => {
  it('never emits claim state for the OWNER view', () => {
    const detail: ApiWishlistDetailDTO = { view: 'OWNER', title: 'Mine', description: null, items: [{ ...item }] };
    const [out] = toWishlistItems(detail, false);
    expect(out).not.toHaveProperty('isPurchased');
  });

  it('never emits claim state for the viewer\'s own list, even if an api sends it', () => {
    const detail: ApiWishlistDetailDTO = {
      view: 'GIVER', title: 'Mine', description: null, items: [{ ...item, isPurchased: true, remainingQuantity: 0 }],
    };
    expect(toWishlistItems(detail, true)[0]).not.toHaveProperty('isPurchased');
  });

  it('never emits claim state when the api sends no view (older revision)', () => {
    const detail: ApiWishlistDetailDTO = { title: 'L', description: null, items: [{ ...item, isPurchased: true }] };
    expect(toWishlistItems(detail, false)[0]).not.toHaveProperty('isPurchased');
  });

  it('tells a giver when nothing is left to get', () => {
    const detail: ApiWishlistDetailDTO = {
      view: 'GIVER', title: 'Mia', description: null,
      items: [{ ...item, isPurchased: false, remainingQuantity: 0 }, { ...item, isPurchased: false, remainingQuantity: 1 }],
    };
    const out = toWishlistItems(detail, false);
    expect(out[0].isPurchased).toBe(true);
    expect(out[1].isPurchased).toBe(false);
  });
});
