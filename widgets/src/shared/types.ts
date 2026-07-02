// Data shapes the widgets consume — mirror the redacted MCP types the tools return
// as `structuredContent`. Kept standalone so the widget bundle stays independent of
// the server's Node types.

export interface FamilyDate {
  date: string; // month-day only, e.g. "November 8"
  type: 'birthday' | 'anniversary' | 'event';
  title: string;
  relatedPersonIds: string[];
  relationshipLabels: string[];
  daysUntil: number;
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

/** structuredContent for `get_upcoming_family_dates`. */
export interface UpcomingDatesOutput {
  upcomingDates: FamilyDate[];
  daysAhead: number;
  totalCount: number;
}

/** structuredContent for `get_family_members`. */
export interface FamilyMembersOutput {
  familyMembers: FamilyMember[];
  totalCount: number;
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

/** structuredContent for `get_person_profile`. */
export interface PersonProfileOutput {
  profile: PersonProfile | null;
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

/** structuredContent for `get_recent_family_activity`. */
export interface RecentActivityOutput {
  recentActivity: FamilyActivity[];
  sinceHours: number;
  totalCount: number;
}
