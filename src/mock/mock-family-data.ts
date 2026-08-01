import type {
  FamilyMember,
  FamilyDate,
  FamilyActivity,
  PersonProfile,
  BirthdayCardContext,
  UpcomingEvent,
  TripSummary,
  TripOverview,
  LifeStoryResult,
  StoryQuestionsResult,
  WishlistSummary,
  FeedPost,
} from '../types/index.js';

export interface MockFamilyMemberData extends FamilyMember {
  interests: string[];
  bioSummary: string;
  importantDates: { label: string; date: string }[];
  parentId?: string;
  partnerId?: string;
}

const today = new Date();
function daysUntilDate(monthDay: string): number {
  const [month, day] = monthDay.split('-').map(Number);
  const target = new Date(today.getFullYear(), month - 1, day);
  if (target < today) {
    target.setFullYear(target.getFullYear() + 1);
  }
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const mockFamilyMembers: MockFamilyMemberData[] = [
  {
    personId: 'user-001',
    displayName: 'Alex Walker',
    relationshipLabel: 'self',
    birthdayMonthDay: '01-15',
    profilePhotoUrl: null,
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['technology', 'cooking', 'running'],
    bioSummary: 'Family organizer and tech enthusiast.',
    importantDates: [{ label: 'Birthday', date: '01-15' }],
  },
  {
    personId: 'person-002',
    displayName: 'Linda Walker',
    relationshipLabel: 'mother',
    birthdayMonthDay: '07-15',
    profilePhotoUrl: 'https://photos.a2me.app/linda-walker.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['gardening', 'reading', 'baking'],
    bioSummary: 'Retired teacher who loves spending time with grandchildren.',
    importantDates: [
      { label: 'Birthday', date: '07-15' },
      { label: 'Anniversary', date: '06-20' },
    ],
  },
  {
    personId: 'person-003',
    displayName: 'Robert Walker',
    relationshipLabel: 'father',
    birthdayMonthDay: '03-22',
    profilePhotoUrl: 'https://photos.a2me.app/robert-walker.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['woodworking', 'fishing', 'history'],
    bioSummary: 'Semi-retired engineer. Loves building things.',
    importantDates: [
      { label: 'Birthday', date: '03-22' },
      { label: 'Anniversary', date: '06-20' },
    ],
    partnerId: 'person-002',
  },
  {
    personId: 'person-004',
    displayName: 'Margaret Walker',
    relationshipLabel: 'grandmother',
    birthdayMonthDay: '11-08',
    profilePhotoUrl: null,
    isManagedAccount: false,
    isLegacyAccount: true,
    interests: ['knitting', 'crosswords', 'tea'],
    bioSummary: "Robert's mother. The family matriarch.",
    importantDates: [{ label: 'Birthday', date: '11-08' }],
  },
  {
    personId: 'person-005',
    displayName: 'Sarah Walker',
    relationshipLabel: 'sister',
    birthdayMonthDay: '05-03',
    profilePhotoUrl: 'https://photos.a2me.app/sarah-walker.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['painting', 'hiking', 'coffee'],
    bioSummary: 'Creative soul and avid hiker. Works as a graphic designer.',
    importantDates: [
      { label: 'Birthday', date: '05-03' },
      { label: 'Wedding Anniversary', date: '09-10' },
    ],
    partnerId: 'person-006',
  },
  {
    personId: 'person-006',
    displayName: 'James Chen',
    relationshipLabel: 'brother-in-law',
    birthdayMonthDay: '08-27',
    profilePhotoUrl: 'https://photos.a2me.app/james-chen.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['cycling', 'photography', 'cooking'],
    bioSummary: "Sarah's husband. Software developer and hobby photographer.",
    importantDates: [
      { label: 'Birthday', date: '08-27' },
      { label: 'Wedding Anniversary', date: '09-10' },
    ],
    partnerId: 'person-005',
  },
  {
    personId: 'person-007',
    displayName: 'David Walker',
    relationshipLabel: 'uncle',
    birthdayMonthDay: '09-14',
    profilePhotoUrl: null,
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['travel', 'jazz', 'wine'],
    bioSummary: "Robert's brother. World traveler and jazz enthusiast.",
    importantDates: [{ label: 'Birthday', date: '09-14' }],
  },
  {
    personId: 'person-008',
    displayName: 'Emily Walker',
    relationshipLabel: 'cousin',
    birthdayMonthDay: '02-19',
    profilePhotoUrl: 'https://photos.a2me.app/emily-walker.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['volleyball', 'music', 'coding'],
    bioSummary: "David's daughter. College student studying computer science.",
    importantDates: [{ label: 'Birthday', date: '02-19' }],
    parentId: 'person-007',
  },
  {
    personId: 'person-009',
    displayName: 'Jordan Rivera',
    relationshipLabel: 'partner',
    birthdayMonthDay: '04-11',
    profilePhotoUrl: 'https://photos.a2me.app/jordan-rivera.jpg',
    isManagedAccount: false,
    isLegacyAccount: false,
    interests: ['yoga', 'writing', 'architecture'],
    bioSummary: "Alex's partner. Freelance writer and yoga instructor.",
    importantDates: [
      { label: 'Birthday', date: '04-11' },
      { label: 'Anniversary with Alex', date: '10-05' },
    ],
    partnerId: 'user-001',
  },
  {
    personId: 'person-010',
    displayName: 'Max Walker-Rivera',
    relationshipLabel: 'son',
    birthdayMonthDay: '12-01',
    profilePhotoUrl: null,
    isManagedAccount: true,
    isLegacyAccount: false,
    interests: ['dinosaurs', 'legos', 'swimming'],
    bioSummary: "Alex and Jordan's son. Loves dinosaurs and building things.",
    importantDates: [{ label: 'Birthday', date: '12-01' }],
    parentId: 'user-001',
  },
];

export function getMockFamilyDates(): FamilyDate[] {
  const dates: FamilyDate[] = [];
  for (const member of mockFamilyMembers) {
    if (member.personId === 'user-001') continue;
    if (member.birthdayMonthDay) {
      dates.push({
        date: member.birthdayMonthDay,
        type: 'birthday',
        title: `${member.displayName}'s Birthday`,
        relatedPersonIds: [member.personId],
        relationshipLabels: [member.relationshipLabel],
        daysUntil: daysUntilDate(member.birthdayMonthDay),
      });
    }
    for (const d of member.importantDates) {
      if (d.label.toLowerCase().includes('anniversary')) {
        dates.push({
          date: d.date,
          type: 'anniversary',
          title: `${d.label} — ${member.displayName}`,
          relatedPersonIds: [member.personId],
          relationshipLabels: [member.relationshipLabel],
          daysUntil: daysUntilDate(d.date),
        });
      }
    }
  }
  // Add a mock family event
  const eventDate = new Date(today);
  eventDate.setDate(eventDate.getDate() + 14);
  const eventMonthDay = `${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
  dates.push({
    date: eventMonthDay,
    type: 'event',
    title: 'Walker Family Reunion BBQ',
    relatedPersonIds: ['person-003', 'person-007'],
    relationshipLabels: ['father', 'uncle'],
    daysUntil: 14,
  });

  return dates.sort((a, b) => a.daysUntil - b.daysUntil);
}

export function getMockRecentActivity(): FamilyActivity[] {
  const now = new Date();
  return [
    {
      activityId: 'activity-001',
      type: 'photo',
      authorDisplayName: 'Sarah Walker',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      summary: 'Shared 3 photos from a weekend hike at Eagle Creek Trail.',
      mediaCount: 3,
      visibility: 'family',
    },
    {
      activityId: 'activity-002',
      type: 'post',
      authorDisplayName: 'Linda Walker',
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
      summary: 'Posted about finishing a new book: "The Midnight Library" — highly recommends it.',
      mediaCount: 0,
      visibility: 'family',
    },
    {
      activityId: 'activity-003',
      type: 'birthday_card',
      authorDisplayName: 'James Chen',
      createdAt: new Date(now.getTime() - 18 * 60 * 60 * 1000).toISOString(),
      summary: "Started a birthday card for Robert Walker's upcoming birthday.",
      mediaCount: 1,
      visibility: 'contributors',
    },
    {
      activityId: 'activity-004',
      type: 'photo',
      authorDisplayName: 'Jordan Rivera',
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      summary: "Shared a photo of Max's first swimming lesson.",
      mediaCount: 1,
      visibility: 'family',
    },
    {
      activityId: 'activity-005',
      type: 'video',
      authorDisplayName: 'Emily Walker',
      createdAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
      summary: 'Posted a short video from her college volleyball tournament.',
      mediaCount: 1,
      visibility: 'family',
    },
    {
      activityId: 'activity-006',
      type: 'event',
      authorDisplayName: 'Robert Walker',
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
      summary: 'Created event: Walker Family Reunion BBQ in 2 weeks.',
      mediaCount: 0,
      visibility: 'family',
    },
    {
      activityId: 'activity-007',
      type: 'post',
      authorDisplayName: 'David Walker',
      createdAt: new Date(now.getTime() - 60 * 60 * 60 * 1000).toISOString(),
      summary: 'Shared thoughts on his recent trip to Portugal. Loved the food and music scene.',
      mediaCount: 0,
      visibility: 'family',
    },
  ];
}

export function getMockPersonProfile(personId: string): PersonProfile | null {
  const member = mockFamilyMembers.find((m) => m.personId === personId);
  if (!member) return null;

  const recentActivity = getMockRecentActivity().find(
    (a) => a.authorDisplayName === member.displayName,
  );

  return {
    personId: member.personId,
    displayName: member.displayName,
    relationshipLabel: member.relationshipLabel,
    birthdayMonthDay: member.birthdayMonthDay,
    bioSummary: member.bioSummary,
    knownInterests: member.interests,
    importantDates: member.importantDates,
    recentActivitySummary: recentActivity?.summary || null,
  };
}

function isoInDays(days: number, hour = 17): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function isoDateInDays(days: number): string {
  return isoInDays(days).slice(0, 10);
}

export function getMockUpcomingEvents(): UpcomingEvent[] {
  return [
    {
      eventId: 'event-001',
      title: 'Walker Family Reunion BBQ',
      startTime: isoInDays(14, 12),
      endTime: isoInDays(14, 18),
      location: "Robert & Linda's backyard",
      eventType: 'GATHERING',
      myRsvpStatus: 'ATTENDING',
      rsvpCounts: { attending: 6, tentative: 1, declined: 0, invited: 2 },
    },
    {
      eventId: 'event-002',
      title: "Max's Swim Meet",
      startTime: isoInDays(5, 9),
      endTime: isoInDays(5, 11),
      location: 'Community Pool',
      eventType: 'ACTIVITY',
      myRsvpStatus: 'HOSTING',
      rsvpCounts: { attending: 3, tentative: 0, declined: 1, invited: 1 },
    },
    {
      eventId: 'event-003',
      title: "Linda's Birthday Dinner",
      startTime: isoInDays(21, 18),
      endTime: isoInDays(21, 21),
      location: null,
      eventType: 'BIRTHDAY',
      myRsvpStatus: 'INVITED',
      rsvpCounts: { attending: 2, tentative: 2, declined: 0, invited: 4 },
    },
  ];
}

export function getMockTrips(): TripSummary[] {
  return [
    {
      tripId: 'trip-001',
      title: 'Lake Tahoe Family Reunion',
      destination: 'Lake Tahoe, CA',
      startDate: isoDateInDays(30),
      endDate: isoDateInDays(34),
      status: 'PLANNING',
      myRole: 'ORGANIZER',
    },
    {
      tripId: 'trip-002',
      title: "Grandma Margaret's Memorial Weekend",
      destination: 'Portland, OR',
      startDate: isoDateInDays(60),
      endDate: isoDateInDays(62),
      status: 'PLANNING',
      myRole: 'PARTICIPANT',
    },
  ];
}

export function getMockTripOverview(tripId: string): TripOverview | null {
  const trip = getMockTrips().find((t) => t.tripId === tripId);
  if (!trip) return null;

  if (tripId === 'trip-002') {
    return {
      trip: { ...trip, description: 'A weekend to remember Grandma Margaret together.' },
      roster: [
        { displayName: 'Robert Walker', role: 'ORGANIZER', rsvpStatus: 'ATTENDING' },
        { displayName: 'Alex Walker', role: 'PARTICIPANT', rsvpStatus: 'ATTENDING' },
        { displayName: 'David Walker', role: 'PARTICIPANT', rsvpStatus: 'TENTATIVE' },
      ],
      pendingInvites: [],
      travelDetails: [],
      itinerary: [],
    };
  }

  return {
    trip: { ...trip, description: 'Five days on the lake — cabins, boats, and the annual BBQ.' },
    roster: [
      { displayName: 'Alex Walker', role: 'ORGANIZER', rsvpStatus: 'ATTENDING' },
      { displayName: 'Jordan Rivera', role: 'PARTICIPANT', rsvpStatus: 'ATTENDING' },
      { displayName: 'Sarah Walker', role: 'PARTICIPANT', rsvpStatus: 'ATTENDING' },
      { displayName: 'James Chen', role: 'PARTICIPANT', rsvpStatus: 'TENTATIVE' },
      { displayName: 'Linda Walker', role: 'PARTICIPANT', rsvpStatus: 'INVITED' },
    ],
    pendingInvites: [{ maskedEmail: 'd***@example.com', status: 'SENT' }],
    travelDetails: [
      {
        displayName: 'Sarah Walker',
        arrival: {
          flightNumber: 'UA512',
          airline: 'United',
          origin: 'DEN',
          destination: 'RNO',
          departsAt: isoInDays(30, 8),
          arrivesAt: isoInDays(30, 10),
        },
        departure: {
          flightNumber: 'UA519',
          airline: 'United',
          origin: 'RNO',
          destination: 'DEN',
          departsAt: isoInDays(34, 15),
          arrivesAt: isoInDays(34, 18),
        },
        lodging: 'Tahoe Pines Cabin #4',
        notes: 'Renting a car at the airport.',
      },
      {
        displayName: 'Jordan Rivera',
        arrival: null,
        departure: null,
        lodging: 'Tahoe Pines Cabin #2',
        notes: 'Driving up with Alex and Max.',
      },
    ],
    itinerary: [
      {
        title: 'Welcome dinner',
        startTime: isoInDays(30, 18),
        endTime: isoInDays(30, 21),
        location: 'Tahoe Pines Lodge',
      },
      {
        title: 'Boat day',
        startTime: isoInDays(31, 10),
        endTime: isoInDays(31, 16),
        location: 'Sand Harbor',
      },
    ],
  };
}

export function getMockLifeStory(personId: string): LifeStoryResult | null {
  // Only Grandma Margaret has an approved narrative; other members fall back to answers.
  if (personId !== 'person-004') return null;
  return {
    subjectName: 'Margaret Walker',
    kind: 'narrative',
    chapters: [
      {
        heading: 'Childhood',
        content:
          'Margaret grew up on a small farm outside Salem, the eldest of four. Summers meant ' +
          'blackberry picking and helping her mother sell preserves at the county fair.',
      },
      {
        heading: 'Building A Family',
        content:
          'She married Thomas in 1958 and raised Robert and David in Portland, where her kitchen ' +
          'became the gravitational center of the neighborhood.',
      },
      {
        heading: 'Later Years',
        content:
          'Known for her knitting and ruthless crossword speed, Margaret spent her later years ' +
          'surrounded by grandchildren, teaching each of them her secret cinnamon-roll recipe.',
      },
    ],
    answers: [],
    progressSummary: '78% of her story told · 5 voices · 42 memories',
  };
}

export function getMockStoryAnswers(
  personId: string,
): { question: string; answer: string; answeredBy: string; date: string | null }[] {
  if (personId !== 'person-002') return [];
  const daysAgo = (n: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  return [
    {
      question: 'What was her first job?',
      answer: 'Linda taught third grade for 34 years — she still gets letters from students.',
      answeredBy: 'Robert Walker',
      date: daysAgo(12),
    },
    {
      question: 'What is a family tradition she started?',
      answer: 'Sunday pancake breakfasts, every week without fail since 1985.',
      answeredBy: 'Sarah Walker',
      date: daysAgo(30),
    },
    {
      question: 'What does she love to do most?',
      answer: 'Being in her garden — her roses have won the neighborhood contest twice.',
      answeredBy: 'Alex Walker',
      date: daysAgo(45),
    },
  ];
}

export function getMockStoryQuestions(_personId: string): { category: string; text: string }[] {
  return [
    { category: 'CHILDHOOD', text: 'What games did they love to play as a child?' },
    { category: 'CHILDHOOD', text: 'What was their childhood home like?' },
    { category: 'CAREER', text: 'What was their proudest professional moment?' },
    { category: 'RELATIONSHIPS', text: 'How did they meet their partner?' },
    { category: 'TRADITIONS', text: 'What holiday tradition matters most to them?' },
  ];
}

export function getMockStoryProgress(_personId: string): string {
  return '12 of 40 questions answered (30%) · 3 contributors';
}

export function getMockWishlists(personId: string): WishlistSummary[] {
  if (personId === 'person-005') {
    return [
      {
        title: "Sarah's Wishlist",
        description: 'Ideas for birthdays and holidays',
        items: [
          {
            name: 'Watercolor field kit',
            note: 'Prefers warm tones',
            url: 'https://example.com/watercolor-kit',
            priceEstimate: '$45',
            isPurchased: false,
          },
          {
            name: 'Trail running vest',
            note: 'Size M',
            url: null,
            priceEstimate: '$120',
            isPurchased: false,
          },
          {
            name: 'Pour-over coffee set',
            note: null,
            url: null,
            priceEstimate: '$35',
            isPurchased: true,
          },
        ],
      },
    ];
  }
  if (personId === 'person-010') {
    return [
      {
        title: "Max's Wishlist",
        description: null,
        items: [
          {
            name: 'Dinosaur encyclopedia',
            note: 'He already has the pocket edition',
            url: null,
            priceEstimate: '$25',
            isPurchased: false,
          },
        ],
      },
    ];
  }
  return [];
}

export function getMockFeedPosts(): FeedPost[] {
  const daysAgo = (n: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  return [
    {
      postId: 'post-101',
      authorDisplayName: 'Sarah Walker',
      content:
        'Photos from our weekend hike at Eagle Creek Trail — the waterfalls were incredible!',
      createdAt: daysAgo(1),
      hasMedia: true,
    },
    {
      postId: 'post-102',
      authorDisplayName: 'Linda Walker',
      content:
        'Finished "The Midnight Library" — highly recommend it for the next family book swap.',
      createdAt: daysAgo(2),
      hasMedia: false,
    },
    {
      postId: 'post-103',
      authorDisplayName: 'Jordan Rivera',
      content: "Max's first swimming lesson today. He did not want to get out of the pool.",
      createdAt: daysAgo(3),
      hasMedia: true,
    },
    {
      postId: 'post-104',
      authorDisplayName: 'Robert Walker',
      content: 'Throwback to the lake trip last summer — who is in for Tahoe this year?',
      createdAt: daysAgo(40),
      hasMedia: true,
    },
    {
      postId: 'post-105',
      authorDisplayName: 'David Walker',
      content:
        'Lisbon was amazing. The food, the music, the tiles — already planning a return trip.',
      createdAt: daysAgo(90),
      hasMedia: false,
    },
    {
      postId: 'post-106',
      authorDisplayName: 'Emily Walker',
      content: 'Our volleyball team took second at regionals!',
      createdAt: daysAgo(200),
      hasMedia: true,
    },
    {
      postId: 'post-107',
      authorDisplayName: 'Sarah Walker',
      content: 'Painted the lake at sunrise during the cabin trip. One of my favorites so far.',
      createdAt: daysAgo(400),
      hasMedia: true,
    },
  ];
}

export function getMockBirthdayCardContext(personId: string): BirthdayCardContext | null {
  const member = mockFamilyMembers.find((m) => m.personId === personId);
  if (!member) return null;

  return {
    recipientName: member.displayName,
    birthdayMonthDay: member.birthdayMonthDay,
    relationshipToUser: member.relationshipLabel,
    recentMemories: [
      `Shared photos together at last month's family dinner`,
      `Commented on their recent post about weekend activities`,
    ],
    knownInterests: member.interests,
    suggestedToneOptions: ['warm and heartfelt', 'funny and lighthearted', 'nostalgic'],
    existingContributorCount: member.personId === 'person-003' ? 2 : 0,
  };
}
