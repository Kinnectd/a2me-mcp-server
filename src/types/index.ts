export interface AuthContext {
  userId: string;
  displayName: string;
  isAuthenticated: boolean;
}

export interface FamilyMember {
  personId: string;
  displayName: string;
  relationshipLabel: string;
  birthdayMonthDay: string | null;
  profilePhotoUrl: string | null;
  isManagedAccount: boolean;
  isLegacyAccount: boolean;
}

/**
 * A family member enriched with the non-sensitive context fields used to compose profiles and
 * message/birthday-card suggestions (interests + a short bio). Kept internal to the data layer —
 * the public `get_family_members` tool still returns the redacted {@link FamilyMember}. Never
 * carries contact info (email/phone/address) or a birth year.
 */
export interface FamilyMemberDetail extends FamilyMember {
  interests: string[];
  bioSummary: string | null;
}

export interface FamilyDate {
  date: string;
  type: 'birthday' | 'anniversary' | 'event';
  title: string;
  relatedPersonIds: string[];
  relationshipLabels: string[];
  daysUntil: number;
}

export interface FamilyActivity {
  activityId: string;
  type: 'post' | 'photo' | 'video' | 'birthday_card' | 'event';
  authorDisplayName: string;
  createdAt: string;
  summary: string;
  mediaCount: number;
  visibility: string;
}

export interface PersonProfile {
  personId: string;
  displayName: string;
  relationshipLabel: string;
  birthdayMonthDay: string | null;
  bioSummary: string | null;
  knownInterests: string[];
  importantDates: { label: string; date: string }[];
  recentActivitySummary: string | null;
}

export interface RelationshipResult {
  personA: { personId: string; displayName: string };
  personB: { personId: string; displayName: string };
  relationshipLabel: string;
  relationshipPathSummary: string;
}

export interface BirthdayCardContext {
  recipientName: string;
  birthdayMonthDay: string | null;
  relationshipToUser: string;
  recentMemories: string[];
  knownInterests: string[];
  suggestedToneOptions: string[];
  existingContributorCount: number | null;
}

export interface PersonMatch {
  personId: string;
  displayName: string;
  relationshipLabel: string;
  confidence: number;
}

export interface FamilyMemberSearchResult {
  matches: PersonMatch[];
  ambiguous: boolean;
  suggestion: string | null;
}

export interface MessageContext {
  resolvedPerson: PersonMatch;
  relationshipToUser: string;
  occasion: string;
  relevantContext: string[];
  suggestedMessageAngles: string[];
  privacyNotes: string[];
}
