import type {
  FamilyMember,
  FamilyMemberDetail,
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

// --- Subset of the kinnectd-api response shapes we consume (see ROADMAP.md tool→endpoint map). ---
// Only the fields the tools actually use are declared; everything sensitive (email, phoneNumber,
// location/address) is deliberately left off so it can't leak into a tool result.

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
  bio?: string | null;
  interests?: string | null; // free-text; comma/newline separated
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

/** Spring `Page<T>` — we only read `content`. */
interface ApiPage<T> {
  content: T[];
}

interface ApiMediaFileDTO {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'UNKNOWN';
}

interface ApiEventDTO {
  id: string;
  title: string;
  startTime: string; // ISO Instant
  endTime: string;
  owner: ApiUserDTO;
  coHosts?: ApiUserDTO[];
  guests?: { user: ApiUserDTO }[];
}

interface ApiPostDTO {
  id: string;
  content: string | null;
  createdAt: string | null; // ISO Instant
  creator: ApiUserDTO;
  mediaFiles?: ApiMediaFileDTO[] | null;
  visibility?: string | null; // VisibilityLevel enum
  eventId?: string | null;
}

// --- Pure helpers (no I/O) ---------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** UTC midnight (epoch ms) of a date — strips time-of-day so day math is stable across timezones. */
function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Privacy: render a date as month-day only (never the year). UTC so an ISO instant near midnight
 * doesn't shift a day with the server's local offset. */
function monthDayOf(d: Date): string {
  return `${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

/** Whole days from today until the next occurrence of a recurring MM-DD (today → 0, never ~365).
 * Date-only in UTC so the count is stable and same-day is correct. */
function daysUntilMonthDay(monthDay: string): number {
  const now = new Date();
  const today = utcDayStart(now);
  const [month, day] = monthDay.split('-').map(Number);
  let target = Date.UTC(now.getUTCFullYear(), month - 1, day);
  if (target < today) target = Date.UTC(now.getUTCFullYear() + 1, month - 1, day);
  return Math.round((target - today) / MS_PER_DAY);
}

/** Whole days from today (UTC date-only) until a concrete date — later-today → 0, not 1. */
function daysUntilDate(target: Date): number {
  return Math.round((utcDayStart(target) - utcDayStart(new Date())) / MS_PER_DAY);
}

function displayNameOf(u: ApiUserDTO): string {
  // username is the public @handle (never email/phone) — last-resort label only.
  return u.preferredName || u.fullName || u.username;
}

/** Splits the free-text interests field into a clean list. */
function parseInterests(interests: string | null | undefined): string[] {
  if (!interests) return [];
  return interests
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function truncate(text: string, max = 180): string {
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function activityTypeOf(post: ApiPostDTO): FamilyActivity['type'] {
  const media = post.mediaFiles ?? [];
  if (media.some((m) => m.mediaType === 'VIDEO')) return 'video';
  if (media.some((m) => m.mediaType === 'IMAGE')) return 'photo';
  return 'post';
}

/** Maps a PostDTO to the redacted activity summary surfaced to assistants. */
function toFamilyActivity(post: ApiPostDTO): FamilyActivity {
  const type = activityTypeOf(post);
  const mediaCount = post.mediaFiles?.length ?? 0;
  const content = post.content?.trim();
  let summary: string;
  if (content) {
    summary = truncate(content);
  } else if (mediaCount > 0) {
    // type is photo/video only when media of that kind is present; otherwise (audio/unknown) stay
    // generic rather than mislabel an attachment as a photo.
    const noun = type === 'video' ? 'video' : type === 'photo' ? 'photo' : 'attachment';
    summary = `Shared ${mediaCount} ${noun}${mediaCount > 1 ? 's' : ''}.`;
  } else {
    summary = 'Posted an update.';
  }
  return {
    activityId: post.id,
    type,
    authorDisplayName: displayNameOf(post.creator),
    createdAt: post.createdAt ?? new Date().toISOString(),
    summary,
    mediaCount,
    visibility: (post.visibility ?? 'family').toLowerCase(),
  };
}

/**
 * Client for the A2Me (kinnectd-api) REST surface. Read-only.
 *
 * When `config.useMock` is true (the default for the spike), every method returns mock data and
 * no network call is made. Set `A2ME_USE_MOCK=false` (plus a real `A2ME_API_URL` / per-request
 * bearer) to hit the live API. All endpoints used here are on the MCP read-only allowlist in
 * kinnectd-api's `McpTokenAuthenticationFilter`.
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
      const perRequestToken = store?.a2meToken;
      const token = perRequestToken ?? this.authToken;
      if (config.debugTokens) {
        // Diagnostic: token source (derived from the same nullish check as the selection above) and
        // whether it looks like a JWT (3 dot-segments) — tells "fallback forwarded" from "real
        // token, signature issue". No token value is logged.
        const source = perRequestToken == null ? 'FALLBACK' : 'per-request';
        console.warn(`[api] GET ${path} token=${source} jwtSegments=${token.split('.').length}`);
      }
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      };
      // Usage-attribution headers (kinnectd-api records + normalizes these for MCP usage tracking).
      if (store?.mcpTool) headers['X-MCP-Tool'] = store.mcpTool;
      if (store?.mcpClient) headers['X-MCP-Client'] = store.mcpClient;
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers,
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

  /** GET /me/v2/family — the caller's family, scoped server-side. Single source for both the
   * redacted and detailed member views. */
  private fetchFamily(): Promise<ApiGetFamilyResponse> {
    return this.get<ApiGetFamilyResponse>('/me/v2/family?includeLabels=true');
  }

  private static toFamilyMember(m: ApiFamilyMember): FamilyMember {
    return {
      personId: m.user.id,
      displayName: displayNameOf(m.user),
      // Must stay non-empty: some tools match with `.includes(relationshipLabel)`, and
      // includes('') is always true (false positives).
      relationshipLabel: m.neutralLabel || m.genderedLabel || 'relative',
      // Privacy: month-day only, never the birth year.
      birthdayMonthDay: m.user.birthDate ? m.user.birthDate.slice(5) : null,
      profilePhotoUrl: m.user.avatarUrl,
      isManagedAccount: m.user.managedAccountType != null,
      isLegacyAccount: m.user.memorializedAt != null || m.user.deathDate != null,
    };
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
    const data = await this.fetchFamily();
    return data.members.map(A2MeApiClient.toFamilyMember);
  }

  /**
   * Family members enriched with non-sensitive context (interests + bio) for profile/message
   * composition. Internal to the data layer — never returned by the public family tool.
   */
  async getFamilyMembersDetailed(_userId: string): Promise<FamilyMemberDetail[]> {
    if (config.useMock) {
      return mockFamilyMembers.map((m) => ({
        personId: m.personId,
        displayName: m.displayName,
        relationshipLabel: m.relationshipLabel,
        birthdayMonthDay: m.birthdayMonthDay,
        profilePhotoUrl: m.profilePhotoUrl,
        isManagedAccount: m.isManagedAccount,
        isLegacyAccount: m.isLegacyAccount,
        interests: m.interests,
        bioSummary: m.bioSummary,
      }));
    }
    const data = await this.fetchFamily();
    return data.members.map((m) => ({
      ...A2MeApiClient.toFamilyMember(m),
      interests: parseInterests(m.user.interests),
      bioSummary: m.user.bio?.trim() || null,
    }));
  }

  async getUpcomingDates(userId: string, daysAhead: number = 30): Promise<FamilyDate[]> {
    if (config.useMock) {
      return getMockFamilyDates().filter((d) => d.daysUntil <= daysAhead);
    }

    const dates: FamilyDate[] = [];

    // Birthdays derived from the family list (month-day only). Anniversaries aren't exposed by the
    // read-only endpoints, so they're omitted from the live result (vs. the mock).
    const members = await this.getFamilyMembers(userId);
    for (const m of members) {
      if (!m.birthdayMonthDay) continue;
      dates.push({
        date: m.birthdayMonthDay,
        type: 'birthday',
        title: `${m.displayName}'s Birthday`,
        relatedPersonIds: [m.personId],
        relationshipLabels: [m.relationshipLabel],
        daysUntil: daysUntilMonthDay(m.birthdayMonthDay),
      });
    }

    // Upcoming events the user is part of. page/size are required by GET /events; timing=UPCOMING
    // is the default but is passed explicitly for clarity.
    const events = await this.get<ApiPage<ApiEventDTO>>('/events?page=0&size=50&timing=UPCOMING');
    for (const e of events.content) {
      const start = new Date(e.startTime);
      const guestIds = (e.guests ?? []).map((g) => g.user.id);
      const coHostIds = (e.coHosts ?? []).map((u) => u.id);
      dates.push({
        date: monthDayOf(start),
        type: 'event',
        title: e.title,
        relatedPersonIds: [e.owner.id, ...coHostIds, ...guestIds],
        relationshipLabels: [],
        daysUntil: daysUntilDate(start),
      });
    }

    return dates.filter((d) => d.daysUntil <= daysAhead).sort((a, b) => a.daysUntil - b.daysUntil);
  }

  async getRecentActivity(
    _userId: string,
    sinceHours: number = 72,
    limit: number = 20,
  ): Promise<FamilyActivity[]> {
    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000);
    if (config.useMock) {
      return getMockRecentActivity()
        .filter((a) => new Date(a.createdAt) >= cutoff)
        .slice(0, limit);
    }

    const feed = await this.get<ApiPage<ApiPostDTO>>(`/posts/feed?page=0&size=${limit}`);
    return feed.content
      .map(toFamilyActivity)
      .filter((a) => new Date(a.createdAt) >= cutoff)
      .slice(0, limit);
  }

  /** A short, redacted one-liner summarizing a person's most recent post (live mode). */
  private async recentActivitySummaryFor(personId: string): Promise<string | null> {
    const posts = await this.get<ApiPage<ApiPostDTO>>(`/posts/users/${personId}?page=0&size=3`);
    const first = posts.content[0];
    if (!first) return null;
    return toFamilyActivity(first).summary;
  }

  async getPersonProfile(userId: string, personId: string): Promise<PersonProfile | null> {
    if (config.useMock) {
      return getMockPersonProfile(personId);
    }

    const members = await this.getFamilyMembersDetailed(userId);
    const member = members.find((m) => m.personId === personId);
    if (!member) return null;

    const importantDates = member.birthdayMonthDay
      ? [{ label: 'Birthday', date: member.birthdayMonthDay }]
      : [];

    // A person's posts respect privacy/relationship server-side; a fetch failure shouldn't sink
    // the whole profile, so degrade to no summary.
    let recentActivitySummary: string | null = null;
    try {
      recentActivitySummary = await this.recentActivitySummaryFor(personId);
    } catch {
      recentActivitySummary = null;
    }

    return {
      personId: member.personId,
      displayName: member.displayName,
      relationshipLabel: member.relationshipLabel,
      birthdayMonthDay: member.birthdayMonthDay,
      bioSummary: member.bioSummary,
      knownInterests: member.interests,
      importantDates,
      recentActivitySummary,
    };
  }

  async getRelationshipBetween(
    userId: string,
    personAId: string,
    personBId: string,
  ): Promise<RelationshipResult | null> {
    const members = config.useMock ? mockFamilyMembers : await this.getFamilyMembers(userId);
    const personA = members.find((m) => m.personId === personAId);
    const personB = members.find((m) => m.personId === personBId);
    if (!personA || !personB) return null;

    return {
      personA: { personId: personA.personId, displayName: personA.displayName },
      personB: { personId: personB.personId, displayName: personB.displayName },
      relationshipLabel: `${personA.relationshipLabel} ↔ ${personB.relationshipLabel}`,
      relationshipPathSummary: `${personA.displayName} (${personA.relationshipLabel}) and ${personB.displayName} (${personB.relationshipLabel}) are both in your family network.`,
    };
  }

  async getBirthdayCardContext(
    userId: string,
    personId: string,
  ): Promise<BirthdayCardContext | null> {
    if (config.useMock) {
      return getMockBirthdayCardContext(personId);
    }

    const members = await this.getFamilyMembersDetailed(userId);
    const member = members.find((m) => m.personId === personId);
    if (!member) return null;

    // Recent memories from the recipient's own recent posts (redacted summaries). Degrade to a
    // generic prompt if their posts can't be read.
    let recentMemories: string[] = [];
    try {
      const posts = await this.get<ApiPage<ApiPostDTO>>(`/posts/users/${personId}?page=0&size=3`);
      recentMemories = posts.content.map((p) => toFamilyActivity(p).summary);
    } catch {
      recentMemories = [];
    }
    if (recentMemories.length === 0) {
      recentMemories = ['No recent posts available — draw on shared interests below.'];
    }

    return {
      recipientName: member.displayName,
      birthdayMonthDay: member.birthdayMonthDay,
      relationshipToUser: member.relationshipLabel,
      recentMemories,
      knownInterests: member.interests,
      suggestedToneOptions: ['warm and heartfelt', 'funny and lighthearted', 'nostalgic'],
      // Contributor count needs a birthday-card endpoint that isn't on the read-only allowlist yet.
      existingContributorCount: null,
    };
  }
}
