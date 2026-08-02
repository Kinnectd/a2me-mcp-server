import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { resolvePersonInput } from './resolve-person.js';

export const getUnansweredStoryQuestionsSchema = z.object({
  personName: z.string().min(1),
});

const MAX_QUESTIONS = 10;

export async function getUnansweredStoryQuestions(
  input: z.infer<typeof getUnansweredStoryQuestionsSchema>,
) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);

  const resolved = await resolvePersonInput(client, auth.userId, input.personName);
  if (!resolved.ok) {
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ error: resolved.message }) }],
    };
  }

  const result = await client.getUnansweredStoryQuestions(resolved.personId, resolved.displayName);

  // Cap the total question count across categories to keep the result compact.
  let remaining = MAX_QUESTIONS;
  const questionsByCategory = result.questionsByCategory
    .map((group) => {
      const questions = group.questions.slice(0, Math.max(0, remaining));
      remaining -= questions.length;
      return { category: group.category, questions };
    })
    .filter((group) => group.questions.length > 0);

  const structuredContent = {
    subjectName: result.subjectName,
    progressSummary: result.progressSummary,
    questionsByCategory,
  };

  return {
    structuredContent,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(structuredContent, null, 2),
      },
    ],
  };
}

export const getUnansweredStoryQuestionsToolDefinition = {
  name: 'get_unanswered_story_questions',
  description:
    "Story questions about a family member that nobody has answered yet — perfect for 'what should I ask Grandpa when I visit' interview prep. Includes a story-progress summary.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      personName: {
        type: 'string',
        description: 'Family member name or relationship (fuzzy), or "me" for the user themselves',
      },
    },
    required: ['personName'],
  },
};
