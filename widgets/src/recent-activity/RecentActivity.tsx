import { useToolOutput } from '../shared/openai.js';
import { Header, Footer } from '../shared/components.js';
import type { RecentActivityOutput, FamilyActivity } from '../shared/types.js';

const TYPE_ICON: Record<FamilyActivity['type'], string> = {
  post: '📝',
  photo: '📷',
  video: '🎬',
  birthday_card: '🎂',
  event: '📅',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function RecentActivity() {
  const data = useToolOutput<RecentActivityOutput>();
  const items = data?.recentActivity ?? [];

  return (
    <div className="a2me-card">
      <Header title="Recent family activity" sub={items.length ? `${items.length}` : undefined} />
      {items.length === 0 ? (
        <div className="a2me-empty">Nothing new in this window.</div>
      ) : (
        <div className="a2me-list">
          {items.map((a) => (
            <div className="a2me-row" key={a.activityId}>
              <span className="a2me-daytype" aria-hidden>
                {TYPE_ICON[a.type] ?? '📝'}
              </span>
              <span className="a2me-grow">
                <div className="a2me-name">{a.authorDisplayName}</div>
                <div className="a2me-meta">
                  {a.summary}
                  {a.mediaCount > 0 ? ` · ${a.mediaCount} media` : ''}
                </div>
              </span>
              <span className="a2me-time">{timeAgo(a.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
