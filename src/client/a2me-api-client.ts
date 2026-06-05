import type {
  FamilyMember,
  FamilyDate,
  FamilyActivity,
  PersonProfile,
  BirthdayCardContext,
  RelationshipResult,
} from '../types/index.js';
import {
  mockFamilyMembers,
  getMockFamilyDates,
  getMockRecentActivity,
  getMockPersonProfile,
  getMockBirthdayCardContext,
} from '../mock/mock-family-data.js';

// TODO: Replace mock implementations with real A2Me API calls
// Required future endpoints:
// - GET /family/members
// - GET /family/dates/upcoming
// - GET /family/activity/recent
// - GET /people/{personId}/context
// - GET /relationships/path
// - GET /birthday-cards/context/{personId}

export class A2MeApiClient {
  constructor(
    private baseUrl: string,
    private authToken: string,
  ) {}

  async getFamilyMembers(_userId: string): Promise<FamilyMember[]> {
    // TODO: Replace with GET {baseUrl}/family/members
    return mockFamilyMembers.map((m) => ({
      personId: m.personId,
      displayName: m.displayName,
      relationshipLabel: m.relationshipLabel,
      birthdayMonthDay: m.birthdayMonthDay,
      profilePhotoUrl: m.profilePhotoUrl,
      isManagedAccount: m.isManagedAccount,
      isLegacyAccount: m.isLegacyAccount,
    }));
  }

  async getUpcomingDates(_userId: string, daysAhead: number = 30): Promise<FamilyDate[]> {
    // TODO: Replace with GET {baseUrl}/family/dates/upcoming?days={daysAhead}
    return getMockFamilyDates().filter((d) => d.daysUntil <= daysAhead);
  }

  async getRecentActivity(
    _userId: string,
    sinceHours: number = 72,
    limit: number = 20,
  ): Promise<FamilyActivity[]> {
    // TODO: Replace with GET {baseUrl}/family/activity/recent?sinceHours={sinceHours}&limit={limit}
    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    return getMockRecentActivity()
      .filter((a) => new Date(a.createdAt) >= cutoff)
      .slice(0, limit);
  }

  async getPersonProfile(_userId: string, personId: string): Promise<PersonProfile | null> {
    // TODO: Replace with GET {baseUrl}/people/{personId}/context
    return getMockPersonProfile(personId);
  }

  async getRelationshipBetween(
    _userId: string,
    personAId: string,
    personBId: string,
  ): Promise<RelationshipResult | null> {
    // TODO: Replace with GET {baseUrl}/relationships/path?personA={personAId}&personB={personBId}
    const personA = mockFamilyMembers.find((m) => m.personId === personAId);
    const personB = mockFamilyMembers.find((m) => m.personId === personBId);
    if (!personA || !personB) return null;

    return {
      personA: { personId: personA.personId, displayName: personA.displayName },
      personB: { personId: personB.personId, displayName: personB.displayName },
      relationshipLabel: `${personA.relationshipLabel} ↔ ${personB.relationshipLabel}`,
      relationshipPathSummary: `${personA.displayName} (${personA.relationshipLabel}) and ${personB.displayName} (${personB.relationshipLabel}) are both in your family network.`,
    };
  }

  async getBirthdayCardContext(
    _userId: string,
    personId: string,
  ): Promise<BirthdayCardContext | null> {
    // TODO: Replace with GET {baseUrl}/birthday-cards/context/{personId}
    return getMockBirthdayCardContext(personId);
  }
}
