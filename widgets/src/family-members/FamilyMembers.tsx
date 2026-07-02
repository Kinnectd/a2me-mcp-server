import { useToolOutput } from '../shared/openai.js';
import { Header, Footer, Avatar } from '../shared/components.js';
import type { FamilyMembersOutput } from '../shared/types.js';

export function FamilyMembers() {
  const data = useToolOutput<FamilyMembersOutput>();
  const members = data?.familyMembers ?? [];

  return (
    <div className="a2me-card">
      <Header
        title="Your family"
        sub={
          members.length
            ? `${members.length} ${members.length === 1 ? 'person' : 'people'}`
            : undefined
        }
      />
      {members.length === 0 ? (
        <div className="a2me-empty">No family members connected yet.</div>
      ) : (
        <div className="a2me-list">
          {members.map((m) => (
            <div className="a2me-row" key={m.personId}>
              <Avatar name={m.displayName} photoUrl={m.profilePhotoUrl} />
              <span className="a2me-grow">
                <div className="a2me-name">{m.displayName}</div>
                <div className="a2me-meta">
                  {m.relationshipLabel}
                  {m.birthdayMonthDay ? ` · 🎂 ${m.birthdayMonthDay}` : ''}
                </div>
              </span>
              {m.isManagedAccount && <span className="a2me-badge">Managed</span>}
              {m.isLegacyAccount && <span className="a2me-badge">In memory</span>}
            </div>
          ))}
        </div>
      )}
      <Footer />
    </div>
  );
}
