import { useToolOutput } from '../shared/openai.js';
import { Header, Footer, Avatar } from '../shared/components.js';
import type { PersonProfileOutput } from '../shared/types.js';

export function PersonProfile() {
  const data = useToolOutput<PersonProfileOutput>();
  const p = data?.profile ?? null;

  if (!p) {
    return (
      <div className="a2me-card">
        <Header title="Family member" />
        <div className="a2me-empty">Couldn't find that person in your family.</div>
        <Footer />
      </div>
    );
  }

  const interests = p.knownInterests ?? [];
  const dates = p.importantDates ?? [];

  return (
    <div className="a2me-card">
      <Header title="Family member" />
      <div className="a2me-profile">
        <Avatar name={p.displayName} />
        <span className="a2me-grow">
          <h2>{p.displayName}</h2>
          <div className="a2me-meta">
            {p.relationshipLabel}
            {p.birthdayMonthDay ? ` · 🎂 ${p.birthdayMonthDay}` : ''}
          </div>
        </span>
      </div>

      {p.bioSummary && (
        <div className="a2me-section">
          <div className="a2me-bio">{p.bioSummary}</div>
        </div>
      )}

      {interests.length > 0 && (
        <div className="a2me-section">
          <div className="a2me-section-label">Interests</div>
          <div className="a2me-tags">
            {interests.map((it, i) => (
              <span className="a2me-tag" key={`${it}-${i}`}>
                {it}
              </span>
            ))}
          </div>
        </div>
      )}

      {dates.length > 0 && (
        <div className="a2me-section">
          <div className="a2me-section-label">Important dates</div>
          {dates.map((d, i) => (
            <div className="a2me-meta" key={`${d.label}-${i}`}>
              {d.label}: {d.date}
            </div>
          ))}
        </div>
      )}

      {p.recentActivitySummary && (
        <div className="a2me-section">
          <div className="a2me-section-label">Lately</div>
          <div className="a2me-bio">{p.recentActivitySummary}</div>
        </div>
      )}

      <Footer />
    </div>
  );
}
