import { describe, it, expect, vi } from 'vitest';
import { getLifeStory } from '../../src/tools/get-life-story.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_life_story', () => {
  it('returns narrative chapters when an approved narrative exists', async () => {
    const result = await getLifeStory({ personName: 'grandma' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.subjectName).toBe('Margaret Walker');
    expect(parsed.kind).toBe('narrative');
    expect(parsed.chapters).toHaveLength(3);
    expect(parsed.chapters[0]).toHaveProperty('heading');
    expect(parsed.chapters[0]).toHaveProperty('content');
    expect(parsed.chapters[0].heading).toBe('Childhood');
  });

  it('falls back to recent story answers when no narrative exists', async () => {
    const result = await getLifeStory({ personName: 'mom' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.subjectName).toBe('Linda Walker');
    expect(parsed.kind).toBe('answers');
    expect(parsed.chapters).toHaveLength(0);
    expect(parsed.answers.length).toBeGreaterThan(0);
    expect(parsed.answers[0]).toHaveProperty('question');
    expect(parsed.answers[0]).toHaveProperty('answer');
    expect(parsed.answers[0]).toHaveProperty('answeredBy');
  });

  it('says when no story has been recorded at all', async () => {
    const result = await getLifeStory({ personName: 'dad' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.message).toContain('No life story');
    expect(parsed.message).toContain('Robert Walker');
  });

  it('returns an error for an unknown person', async () => {
    const result = await getLifeStory({ personName: 'zzz-nobody' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toContain('zzz-nobody');
  });
});
