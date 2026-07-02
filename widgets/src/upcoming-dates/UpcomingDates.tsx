import { useToolOutput } from '../shared/openai.js';
import { Header, Footer } from '../shared/components.js';
import type { UpcomingDatesOutput, FamilyDate } from '../shared/types.js';

const TYPE_ICON: Record<FamilyDate['type'], string> = {
  birthday: '🎂',
  anniversary: '💍',
  event: '📅',
};

function whenLabel(daysUntil: number): { text: string; soon: boolean } {
  if (daysUntil <= 0) return { text: 'Today', soon: true };
  if (daysUntil === 1) return { text: 'Tomorrow', soon: true };
  if (daysUntil <= 7) return { text: `In ${daysUntil} days`, soon: true };
  return { text: `In ${daysUntil} days`, soon: false };
}

export function UpcomingDates() {
  const data = useToolOutput<UpcomingDatesOutput>();
  const dates = data?.upcomingDates ?? [];

  return (
    <div className="a2me-card">
      <Header
        title="Upcoming family dates"
        sub={data ? `next ${data.daysAhead} days` : undefined}
      />
      {dates.length === 0 ? (
        <div className="a2me-empty">No upcoming birthdays or events in this window.</div>
      ) : (
        <div className="a2me-list">
          {dates.map((d, i) => {
            const when = whenLabel(d.daysUntil);
            const who = d.relationshipLabels.filter(Boolean).join(', ');
            return (
              <div className="a2me-row" key={`${d.title}-${d.date}-${i}`}>
                <span className="a2me-daytype" aria-hidden>
                  {TYPE_ICON[d.type] ?? '📅'}
                </span>
                <span className="a2me-grow">
                  <div className="a2me-name">{d.title}</div>
                  <div className="a2me-meta">
                    {d.date}
                    {who ? ` · ${who}` : ''}
                  </div>
                </span>
                <span className={`a2me-badge${when.soon ? ' soon' : ''}`}>{when.text}</span>
              </div>
            );
          })}
        </div>
      )}
      <Footer />
    </div>
  );
}
