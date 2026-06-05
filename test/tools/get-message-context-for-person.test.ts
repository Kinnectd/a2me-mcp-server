import { describe, it, expect, vi } from 'vitest';
import { getMessageContextForPerson } from '../../src/tools/get-message-context-for-person.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_message_context_for_person', () => {
  it('returns context for a known person by name', async () => {
    const result = await getMessageContextForPerson({ personReference: 'Sarah' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.resolvedPerson).toBeDefined();
    expect(parsed.resolvedPerson.displayName).toBe('Sarah Walker');
    expect(parsed.relationshipToUser).toBe('sister');
    expect(parsed.relevantContext.length).toBeGreaterThan(0);
    expect(parsed.suggestedMessageAngles.length).toBeGreaterThan(0);
  });

  it('returns context with occasion', async () => {
    const result = await getMessageContextForPerson({
      personReference: 'mom',
      occasion: 'birthday',
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.occasion).toBe('birthday');
    expect(
      parsed.suggestedMessageAngles.some((a: string) => a.toLowerCase().includes('birthday')),
    ).toBe(true);
  });

  it('includes privacy notes', async () => {
    const result = await getMessageContextForPerson({ personReference: 'dad' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.privacyNotes).toBeDefined();
    expect(parsed.privacyNotes.length).toBeGreaterThan(0);
    expect(
      parsed.privacyNotes.some(
        (n: string) => n.toLowerCase().includes('privacy') || n.toLowerCase().includes('contact'),
      ),
    ).toBe(true);
  });

  it('returns error for unknown person', async () => {
    const result = await getMessageContextForPerson({ personReference: 'xyznonexistent' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toBeDefined();
  });

  it('respects tone parameter', async () => {
    const result = await getMessageContextForPerson({
      personReference: 'sister',
      tone: 'funny',
    });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.suggestedMessageAngles.some((a: string) => a.includes('funny'))).toBe(true);
  });
});
