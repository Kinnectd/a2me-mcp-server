import type { PersonMatch, FamilyMemberSearchResult, MessageContext } from '../types/index.js';
import { mockFamilyMembers, getMockFamilyDates } from '../mock/mock-family-data.js';

/**
 * The minimal member shape the resolver needs. Both the rich mock data and the live
 * `FamilyMemberDetail` satisfy it, so the same matching logic runs over mock or real family data —
 * the caller injects whichever (defaulting to mock keeps the unit tests provider-free).
 */
export interface ResolverMember {
  personId: string;
  displayName: string;
  relationshipLabel: string;
  interests?: string[];
  bioSummary?: string | null;
}

const RELATIONSHIP_ALIASES: Record<string, string[]> = {
  mother: ['mom', 'mum', 'mama', 'my mother', 'my mom'],
  father: ['dad', 'papa', 'my father', 'my dad'],
  grandmother: ['grandma', 'nana', 'gran', 'my grandmother', 'my grandma'],
  sister: ['sis', 'my sister'],
  brother: ['bro', 'my brother'],
  'brother-in-law': ['my brother-in-law', 'brother in law'],
  uncle: ['my uncle'],
  cousin: ['my cousin'],
  partner: ['my partner', 'my spouse', 'significant other'],
  son: ['my son', 'my boy'],
};

function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/^my\s+/, '');
}

function scoreMatch(member: ResolverMember, query: string): number {
  const normalized = normalizeQuery(query);

  // Exact name match
  if (member.displayName.toLowerCase() === normalized) return 1.0;

  // First name match
  const firstName = member.displayName.split(' ')[0].toLowerCase();
  if (firstName === normalized) return 0.95;

  // Relationship label exact match
  if (member.relationshipLabel === normalized) return 0.9;

  // Relationship alias match
  const aliases = RELATIONSHIP_ALIASES[member.relationshipLabel] || [];
  if (aliases.some((a) => a === query.toLowerCase().trim())) return 0.9;

  // Partial name match
  if (member.displayName.toLowerCase().includes(normalized)) return 0.7;

  // Partial relationship match
  if (member.relationshipLabel.includes(normalized)) return 0.6;

  return 0;
}

export function resolvePersonReference(
  userId: string,
  query: string,
  family: ResolverMember[] = mockFamilyMembers,
): FamilyMemberSearchResult {
  const members = family.filter((m) => m.personId !== userId);
  const scored: { member: ResolverMember; score: number }[] = members
    .map((member) => ({ member, score: scoreMatch(member, query) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      matches: [],
      ambiguous: false,
      suggestion: `No family member found matching "${query}".`,
    };
  }

  const topScore = scored[0].score;
  const topMatches = scored.filter((s) => s.score >= topScore - 0.1);

  const matches: PersonMatch[] = topMatches.map((s) => ({
    personId: s.member.personId,
    displayName: s.member.displayName,
    relationshipLabel: s.member.relationshipLabel,
    confidence: s.score,
  }));

  const ambiguous = matches.length > 1 && topScore < 0.9;

  return {
    matches,
    ambiguous,
    suggestion: ambiguous
      ? `Multiple matches found for "${query}". Did you mean: ${matches.map((m) => `${m.displayName} (${m.relationshipLabel})`).join(', ')}?`
      : null,
  };
}

export function resolveRelationshipReference(
  userId: string,
  label: string,
): FamilyMemberSearchResult {
  const normalized = normalizeQuery(label);
  const members = mockFamilyMembers.filter((m) => m.personId !== userId);

  const directMatch = members.filter((m) => m.relationshipLabel === normalized);
  if (directMatch.length > 0) {
    return {
      matches: directMatch.map((m) => ({
        personId: m.personId,
        displayName: m.displayName,
        relationshipLabel: m.relationshipLabel,
        confidence: 0.95,
      })),
      ambiguous: directMatch.length > 1,
      suggestion:
        directMatch.length > 1
          ? `Found ${directMatch.length} family members with relationship "${label}".`
          : null,
    };
  }

  // Check aliases
  for (const [relLabel, aliases] of Object.entries(RELATIONSHIP_ALIASES)) {
    if (aliases.some((a) => normalizeQuery(a) === normalized || a === label.toLowerCase().trim())) {
      const aliasMatches = members.filter((m) => m.relationshipLabel === relLabel);
      if (aliasMatches.length > 0) {
        return {
          matches: aliasMatches.map((m) => ({
            personId: m.personId,
            displayName: m.displayName,
            relationshipLabel: m.relationshipLabel,
            confidence: 0.9,
          })),
          ambiguous: aliasMatches.length > 1,
          suggestion: null,
        };
      }
    }
  }

  return {
    matches: [],
    ambiguous: false,
    suggestion: `No family member found with relationship "${label}".`,
  };
}

export function resolvePersonByName(userId: string, name: string): FamilyMemberSearchResult {
  const normalized = name.toLowerCase().trim();
  const members = mockFamilyMembers.filter((m) => m.personId !== userId);

  const exactMatch = members.filter((m) => m.displayName.toLowerCase() === normalized);
  if (exactMatch.length > 0) {
    return {
      matches: exactMatch.map((m) => ({
        personId: m.personId,
        displayName: m.displayName,
        relationshipLabel: m.relationshipLabel,
        confidence: 1.0,
      })),
      ambiguous: false,
      suggestion: null,
    };
  }

  const firstNameMatch = members.filter(
    (m) => m.displayName.split(' ')[0].toLowerCase() === normalized,
  );
  if (firstNameMatch.length > 0) {
    return {
      matches: firstNameMatch.map((m) => ({
        personId: m.personId,
        displayName: m.displayName,
        relationshipLabel: m.relationshipLabel,
        confidence: 0.9,
      })),
      ambiguous: firstNameMatch.length > 1,
      suggestion:
        firstNameMatch.length > 1
          ? `Multiple people named "${name}" found: ${firstNameMatch.map((m) => `${m.displayName} (${m.relationshipLabel})`).join(', ')}`
          : null,
    };
  }

  const partialMatch = members.filter((m) => m.displayName.toLowerCase().includes(normalized));
  return {
    matches: partialMatch.map((m) => ({
      personId: m.personId,
      displayName: m.displayName,
      relationshipLabel: m.relationshipLabel,
      confidence: 0.7,
    })),
    ambiguous: partialMatch.length > 1,
    suggestion: partialMatch.length === 0 ? `No family member found named "${name}".` : null,
  };
}

export function resolveUpcomingDates(
  _userId: string,
  filters?: { type?: string; daysAhead?: number },
) {
  const dates = getMockFamilyDates();
  let result = dates;

  if (filters?.type) {
    result = result.filter((d) => d.type === filters.type);
  }
  if (filters?.daysAhead !== undefined) {
    const ahead = filters.daysAhead;
    result = result.filter((d) => d.daysUntil <= ahead);
  }
  return result;
}

export function getSafeMemoryContext(
  _userId: string,
  personId: string,
  family: ResolverMember[] = mockFamilyMembers,
): string[] {
  const member = family.find((m) => m.personId === personId);
  if (!member) return [];

  const memories: string[] = [];
  const interests = member.interests ?? [];
  if (interests.length > 0) {
    memories.push(`Known interests: ${interests.join(', ')}`);
  }
  if (member.bioSummary) {
    memories.push(member.bioSummary);
  }
  // Privacy-safe: no emails, phone numbers, addresses, or full DOBs
  return memories;
}

export function getMessageContext(
  userId: string,
  personReference: string,
  occasion?: string,
  tone?: string,
  family: ResolverMember[] = mockFamilyMembers,
): MessageContext | null {
  const result = resolvePersonReference(userId, personReference, family);
  if (result.matches.length === 0) return null;

  const person = result.matches[0];
  const member = family.find((m) => m.personId === person.personId);
  if (!member) return null;

  const memories = getSafeMemoryContext(userId, person.personId, family);
  const resolvedOccasion = occasion || 'general message';
  const interests = member.interests ?? [];

  const suggestedAngles: string[] = [];
  if (interests.length > 0) {
    suggestedAngles.push(
      `Reference their interest in ${interests[0]} or ${interests[1] || interests[0]}`,
    );
  }
  suggestedAngles.push(`Mention your relationship as their ${member.relationshipLabel}`);
  if (resolvedOccasion === 'birthday') {
    suggestedAngles.push('Include a warm birthday wish');
    suggestedAngles.push('Recall a shared memory or experience');
  }
  if (tone) {
    suggestedAngles.push(`Keep the tone ${tone}`);
  }

  return {
    resolvedPerson: person,
    relationshipToUser: member.relationshipLabel,
    occasion: resolvedOccasion,
    relevantContext: memories,
    suggestedMessageAngles: suggestedAngles,
    privacyNotes: [
      'No personal contact information included.',
      'Only month/day of birthday shared (not full DOB or year).',
      'No physical addresses or private account details exposed.',
    ],
  };
}
