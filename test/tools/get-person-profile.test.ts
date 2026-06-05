import { describe, it, expect, vi } from 'vitest';
import { getPersonProfile } from '../../src/tools/get-person-profile.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_person_profile', () => {
  it('returns a valid profile for known person', async () => {
    const result = await getPersonProfile({ personId: 'person-005' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.personId).toBe('person-005');
    expect(parsed.displayName).toBe('Sarah Walker');
    expect(parsed.relationshipLabel).toBe('sister');
    expect(parsed.knownInterests).toContain('painting');
    expect(parsed.knownInterests).toContain('hiking');
    expect(parsed.knownInterests).toContain('coffee');
  });

  it('returns error for unknown person', async () => {
    const result = await getPersonProfile({ personId: 'nonexistent' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toBeDefined();
    expect(parsed.error).toContain('nonexistent');
  });

  it('returns correct profile shape', async () => {
    const result = await getPersonProfile({ personId: 'person-002' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toHaveProperty('personId');
    expect(parsed).toHaveProperty('displayName');
    expect(parsed).toHaveProperty('relationshipLabel');
    expect(parsed).toHaveProperty('birthdayMonthDay');
    expect(parsed).toHaveProperty('bioSummary');
    expect(parsed).toHaveProperty('knownInterests');
    expect(parsed).toHaveProperty('importantDates');
  });

  it('does not expose private information', async () => {
    const result = await getPersonProfile({ personId: 'person-002' });
    const text = result.content[0].text;

    expect(text).not.toContain('email');
    expect(text).not.toContain('phone');
    expect(text).not.toContain('address');
    // Birthday should be month-day only
    const parsed = JSON.parse(text);
    if (parsed.birthdayMonthDay) {
      expect(parsed.birthdayMonthDay).toMatch(/^\d{2}-\d{2}$/);
    }
  });
});
