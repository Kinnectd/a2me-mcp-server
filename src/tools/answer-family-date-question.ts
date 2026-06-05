import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import { resolvePersonReference } from '../resolver/family-context-resolver.js';

export const answerFamilyDateQuestionSchema = z.object({
  question: z.string().min(1),
});

export async function answerFamilyDateQuestion(
  input: z.infer<typeof answerFamilyDateQuestionSchema>,
) {
  const auth = requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const allDates = await client.getUpcomingDates(auth.userId, 365);

  const question = input.question.toLowerCase();

  // Try to extract a person reference from the question
  const personKeywords = ['birthday', "birthday's", 'born'];
  let relevantDates = allDates;

  // Check if asking about a specific person
  const members = await client.getFamilyMembers(auth.userId);
  for (const member of members) {
    const firstName = member.displayName.split(' ')[0].toLowerCase();
    if (question.includes(firstName) || question.includes(member.relationshipLabel)) {
      relevantDates = allDates.filter((d) => d.relatedPersonIds.includes(member.personId));
      break;
    }
  }

  // Check if asking about a type
  if (question.includes('birthday')) {
    relevantDates = relevantDates.filter((d) => d.type === 'birthday');
  } else if (question.includes('anniversary')) {
    relevantDates = relevantDates.filter((d) => d.type === 'anniversary');
  } else if (question.includes('event')) {
    relevantDates = relevantDates.filter((d) => d.type === 'event');
  }

  // Check if asking about "next" or "upcoming"
  if (question.includes('next') || question.includes('upcoming') || question.includes('soon')) {
    relevantDates = relevantDates.slice(0, 3);
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            question: input.question,
            matchedDates: relevantDates,
            totalMatches: relevantDates.length,
            note: 'Dates shown as month-day only. Full birth years are not shared for privacy.',
          },
          null,
          2,
        ),
      },
    ],
  };
}

export const answerFamilyDateQuestionToolDefinition = {
  name: 'answer_family_date_question',
  description:
    'Answers natural language questions about family dates like "When is mom\'s birthday?", "What anniversaries are coming up?", "Who has a birthday next month?"',
  inputSchema: {
    type: 'object' as const,
    properties: {
      question: {
        type: 'string',
        description: 'A natural language question about family dates',
      },
    },
    required: ['question'],
  },
};
