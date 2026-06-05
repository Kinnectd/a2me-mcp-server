import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getFamilyMembers } from '../../src/tools/get-family-members.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_family_members', () => {
  it('returns family members excluding the authenticated user', async () => {
    const result = await getFamilyMembers({});
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.familyMembers).toBeDefined();
    expect(parsed.totalCount).toBeGreaterThan(0);
    // Should not include self
    const selfMember = parsed.familyMembers.find(
      (m: { personId: string }) => m.personId === 'user-001',
    );
    expect(selfMember).toBeUndefined();
  });

  it('returns correct shape for each family member', async () => {
    const result = await getFamilyMembers({});
    const parsed = JSON.parse(result.content[0].text);

    for (const member of parsed.familyMembers) {
      expect(member).toHaveProperty('personId');
      expect(member).toHaveProperty('displayName');
      expect(member).toHaveProperty('relationshipLabel');
      expect(member).toHaveProperty('birthdayMonthDay');
      expect(member).toHaveProperty('isManagedAccount');
    }
  });

  it('does not expose private data (no emails, phones, addresses)', async () => {
    const result = await getFamilyMembers({});
    const text = result.content[0].text;

    expect(text).not.toContain('@');
    expect(text).not.toContain('phone');
    expect(text).not.toContain('address');
    expect(text).not.toContain('email');
  });
});
