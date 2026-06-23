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
import { config } from '../config.js';
import { requestContext } from '../request-context.js';

// --- Subset of the kinnectd-api response shapes we consume (see ROADMAP.md tool→endpoint map) ---

interface ApiUserDTO {
  id: string;
  username: string;
  fullName: string | null;
  preferredName: string | null;
  birthDate: string | null; // ISO yyyy-MM-dd
  deathDate: string | null;
  avatarUrl: string | null;
  managedAccountType: string | null;
  memorializedAt: string | null;
}

interface ApiFamilyMember {
  user: ApiUserDTO;
  neutralLabel?: string;
  genderedLabel?: string;
}

interface ApiGetFamilyResponse {
  viewerUserId: string;
  members: ApiFamilyMember[];
}

/**
 * Client for the A2Me (kinnectd-api) REST surface. Read-only.
 *
 * When `config.useMock` is true (the default for the spike), every method returns mock data and
 * no network call is made. Set `A2ME_USE_MOCK=false` (plus a real `A2ME_API_URL` / `A2ME_AUTH_TOKEN`)
 * to hit the live API. Remaining methods are wired incrementally — see ROADMAP.md "Phase 0".
 */
export class A2MeApiClient {
  constructor(
    private baseUrl: string,
    private authToken: string,
  ) {}

  /** Authenticated GET against kinnectd-api, returning parsed JSON of type T. Times out so a hung
   * connection can't stall a tool request indefinitely (Node fetch has no default timeout). */
  private async get<T>(path: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.requestTimeoutMs);
    try {
      // Prefer the per-request user token (remote/HTTP transport) so we call kinnectd-api as the
      // authenticated user; fall back to the constructor token (stdio / dev).
      const store = requestContext.getStore();
      const token = store?.a2meToken ?? this.authToken;
      // Diagnostic: which token source, and whether it looks like a JWT (3 dot-segments) — so we can
      // tell "fallback forwarded" from "real token, signature issue". No token value is logged.
      console.warn(
        `[api] GET ${path} token=${store?.a2meToken ? 'per-request' : 'FALLBACK'} jwtSegments=${token.split('.').length}`,
      );
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`A2Me API ${path} failed: ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  async getFamilyMembers(_userId: string): Promise<FamilyMember[]> {
    if (config.useMock) {
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

    // GET /me/v2/family?includeLabels=true — scoped server-side to the caller's family.
    const data = await this.get<ApiGetFamilyResponse>('/me/v2/family?includeLabels=true');
    return data.members.map((m) => ({
      personId: m.user.id,
      // username is the public @handle (not email/phone), used only if no name is set.
      displayName: m.user.preferredName || m.user.fullName || m.user.username,
      // Must stay non-empty: some tools match with `.includes(relationshipLabel)`, and
      // includes('') is always true (false positives).
      relationshipLabel: m.neutralLabel || m.genderedLabel || 'relative',
      // Privacy: month-day only, never the birth year.
      birthdayMonthDay: m.user.birthDate ? m.user.birthDate.slice(5) : null,
      profilePhotoUrl: m.user.avatarUrl,
      isManagedAccount: m.user.managedAccountType != null,
      isLegacyAccount: m.user.memorializedAt != null || m.user.deathDate != null,
    }));
  }

  async getUpcomingDates(_userId: string, daysAhead: number = 30): Promise<FamilyDate[]> {
    // TODO(Phase 0): derive from getFamilyMembers() birthdays + GET /events?timing=UPCOMING.
    return getMockFamilyDates().filter((d) => d.daysUntil <= daysAhead);
  }

  async getRecentActivity(
    _userId: string,
    sinceHours: number = 72,
    limit: number = 20,
  ): Promise<FamilyActivity[]> {
    // TODO(Phase 0): GET /posts/feed?page=0&size={limit}, then filter client-side by createdAt.
    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    return getMockRecentActivity()
      .filter((a) => new Date(a.createdAt) >= cutoff)
      .slice(0, limit);
  }

  async getPersonProfile(_userId: string, personId: string): Promise<PersonProfile | null> {
    // TODO(Phase 0): compose family member (above) + GET /posts/users/{personId}.
    return getMockPersonProfile(personId);
  }

  async getRelationshipBetween(
    _userId: string,
    personAId: string,
    personBId: string,
  ): Promise<RelationshipResult | null> {
    // TODO(Phase 0): derive from the labeled family list (up/down + neutralLabel) — no extra call.
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
    // TODO(Phase 0): compose getPersonProfile() + recent activity for the person.
    return getMockBirthdayCardContext(personId);
  }
}
