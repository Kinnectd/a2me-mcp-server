import type {
  FamilyMember,
  FamilyDate,
  FamilyActivity,
  PersonProfile,
  BirthdayCardContext,
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
