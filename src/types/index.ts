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

/** An upcoming event the user hosts or is invited to (compact, redacted). */
export interface UpcomingEvent {
  eventId: string;
  title: string;
  startTime: string;
  endTime: string;
  /** Venue name/alias only — never a street address. */
  location: string | null;
  eventType: string;
  /** 'HOSTING' when the user owns/co-hosts; otherwise their guest RSVP, or null if unknown. */
  myRsvpStatus: string | null;
  rsvpCounts: { attending: number; tentative: number; declined: number; invited: number };
}

/** One trip from GET /trips/mine, reduced to what the trip tools need. */
export interface TripSummary {
  tripId: string;
  title: string;
  destination: string | null;
  startDate: string;
  endDate: string;
  status: string;
  myRole: string | null;
}

export interface TripRosterEntry {
  displayName: string;
  role: string;
  rsvpStatus: string;
}

export interface TripTravelDetail {
  displayName: string;
  arrival: {
    flightNumber: string | null;
    airline: string | null;
    origin: string | null;
    destination: string | null;
    departsAt: string | null;
    arrivesAt: string | null;
  } | null;
  departure: {
    flightNumber: string | null;
    airline: string | null;
    origin: string | null;
    destination: string | null;
    departsAt: string | null;
    arrivesAt: string | null;
  } | null;
  lodging: string | null;
  notes: string | null;
}

export interface TripItineraryItem {
  title: string;
  startTime: string;
  endTime: string;
  location: string | null;
}

export interface TripOverview {
  trip: TripSummary & { description: string | null };
  roster: TripRosterEntry[];
  /** Invited-but-not-yet-joined, emails masked for privacy. */
  pendingInvites: { maskedEmail: string; status: string }[];
  travelDetails: TripTravelDetail[];
  itinerary: TripItineraryItem[];
}

/** A person's life story: approved narrative chapters, or recent answers as fallback. */
export interface LifeStoryResult {
  subjectName: string;
  kind: 'narrative' | 'answers';
  chapters: { heading: string; content: string }[];
  answers: { question: string; answer: string; answeredBy: string; date: string | null }[];
  progressSummary: string | null;
}

export interface StoryQuestionsResult {
  subjectName: string;
  progressSummary: string | null;
  questionsByCategory: { category: string; questions: string[] }[];
}

export interface WishlistSummary {
  title: string;
  description: string | null;
  items: {
    name: string;
    note: string | null;
    url: string | null;
    priceEstimate: string | null;
    isPurchased: boolean;
  }[];
}

/** A feed post reduced to the fields keyword search needs (content stays server-redacted). */
export interface FeedPost {
  postId: string;
  authorDisplayName: string;
  content: string;
  createdAt: string;
  hasMedia: boolean;
}

export interface MessageContext {
  resolvedPerson: PersonMatch;
  relationshipToUser: string;
  occasion: string;
  relevantContext: string[];
  suggestedMessageAngles: string[];
  privacyNotes: string[];
}
