import { describe, it, expect, vi } from 'vitest';
import { findFamilyMember } from '../../src/tools/find-family-member.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('find_family_member', () => {
  it('finds a member by first name', async () => {
    const result = await findFamilyMember({ query: 'Sarah' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.matches.length).toBeGreaterThan(0);
    expect(parsed.matches[0].displayName).toBe('Sarah Walker');
    expect(parsed.matches[0].confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('finds a member by relationship label', async () => {
    const result = await findFamilyMember({ query: 'grandmother' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.matches.length).toBeGreaterThan(0);
    expect(parsed.matches[0].displayName).toBe('Margaret Walker');
    expect(parsed.matches[0].relationshipLabel).toBe('grandmother');
  });

  it('finds a member using "my" prefix', async () => {
    const result = await findFamilyMember({ query: 'my grandmother' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.matches.length).toBeGreaterThan(0);
    expect(parsed.matches[0].displayName).toBe('Margaret Walker');
  });

  it('finds a member using common aliases (mom)', async () => {
    const result = await findFamilyMember({ query: 'mom' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.matches.length).toBeGreaterThan(0);
    expect(parsed.matches[0].displayName).toBe('Linda Walker');
    expect(parsed.matches[0].relationshipLabel).toBe('mother');
  });

  it('returns empty results for unknown queries', async () => {
    const result = await findFamilyMember({ query: 'xyznonexistent' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.matches.length).toBe(0);
    expect(parsed.suggestion).toBeDefined();
  });

  it('handles ambiguous name matches (Walker)', async () => {
    const result = await findFamilyMember({ query: 'Walker' });
    const parsed = JSON.parse(result.content[0].text);

    // Multiple family members have "Walker" in their name
    expect(parsed.matches.length).toBeGreaterThan(1);
    expect(parsed.ambiguous).toBe(true);
  });
});
