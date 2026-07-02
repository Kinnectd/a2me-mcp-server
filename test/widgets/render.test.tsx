// @vitest-environment happy-dom
import { describe, it, expect, afterEach } from 'vitest';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { UpcomingDates } from '../../widgets/src/upcoming-dates/UpcomingDates.js';
import { FamilyMembers } from '../../widgets/src/family-members/FamilyMembers.js';

// The widgets read their data from window.openai.toolOutput (the tool's structuredContent).
function setToolOutput(output: unknown): void {
  (window as unknown as { openai: Record<string, unknown> }).openai = {
    theme: 'light',
    displayMode: 'inline',
    toolOutput: output,
  };
}

let root: Root | null = null;
function render(node: React.ReactNode): string {
  const el = document.createElement('div');
  document.body.appendChild(el);
  act(() => {
    root = createRoot(el);
    root.render(node);
  });
  return el.textContent ?? '';
}

afterEach(() => {
  if (root) act(() => root!.unmount());
  root = null;
  document.body.innerHTML = '';
});

describe('UpcomingDates widget', () => {
  it('renders dates with relationship, month-day, and a relative-time badge', () => {
    setToolOutput({
      upcomingDates: [
        {
          date: '07-15',
          type: 'birthday',
          title: "Linda Walker's Birthday",
          relatedPersonIds: ['p2'],
          relationshipLabels: ['mother'],
          daysUntil: 0,
        },
      ],
      daysAhead: 30,
      totalCount: 1,
    });
    const text = render(<UpcomingDates />);
    expect(text).toContain('Upcoming family dates');
    expect(text).toContain("Linda Walker's Birthday");
    expect(text).toContain('07-15');
    expect(text).toContain('mother');
    expect(text).toContain('Today');
  });

  it('shows an empty state when there are no dates', () => {
    setToolOutput({ upcomingDates: [], daysAhead: 30, totalCount: 0 });
    const text = render(<UpcomingDates />);
    expect(text).toContain('No upcoming');
  });
});

describe('FamilyMembers widget', () => {
  it('renders members with relationship labels', () => {
    setToolOutput({
      familyMembers: [
        {
          personId: 'p1',
          displayName: 'Sarah Walker',
          relationshipLabel: 'sister',
          birthdayMonthDay: 'March 4',
          profilePhotoUrl: null,
          isManagedAccount: false,
          isLegacyAccount: false,
        },
      ],
      totalCount: 1,
    });
    const text = render(<FamilyMembers />);
    expect(text).toContain('Your family');
    expect(text).toContain('Sarah Walker');
    expect(text).toContain('sister');
  });
});
