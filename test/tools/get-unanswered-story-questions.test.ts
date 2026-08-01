import { describe, it, expect, vi } from 'vitest';
import { getUnansweredStoryQuestions } from '../../src/tools/get-unanswered-story-questions.js';

vi.mock('../../src/auth/auth-context.js', () => ({
  requireAuth: () => ({ userId: 'user-001', displayName: 'Alex Walker', isAuthenticated: true }),
}));

describe('get_unanswered_story_questions', () => {
  it('returns questions grouped by category with a progress line', async () => {
    const result = await getUnansweredStoryQuestions({ personName: 'grandma' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.subjectName).toBe('Margaret Walker');
    expect(parsed.progressSummary).toContain('answered');
    expect(parsed.questionsByCategory.length).toBeGreaterThan(0);
    const group = parsed.questionsByCategory[0];
    expect(group).toHaveProperty('category');
    expect(group.questions.length).toBeGreaterThan(0);
  });

  it('caps the total number of questions at 10', async () => {
    const result = await getUnansweredStoryQuestions({ personName: 'mom' });
    const parsed = JSON.parse(result.content[0].text);

    const total = parsed.questionsByCategory.reduce(
      (sum: number, g: { questions: string[] }) => sum + g.questions.length,
      0,
    );
    expect(total).toBeLessThanOrEqual(10);
  });

  it('returns an error for an unknown person', async () => {
    const result = await getUnansweredStoryQuestions({ personName: 'zzz-nobody' });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed.error).toContain('zzz-nobody');
  });
});
